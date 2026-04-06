import { Transaction } from '@/types/transaction.types';
import { AccountRepository } from '@repositories/account.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { getClient } from '@utils/db.helper';
import {
    getIdempotencyResult,
    saveIdempotencyResult,
} from '@utils/idempotency';

export class TransactionService {
    constructor(
        private accountRepository: AccountRepository,
        private transactionRepository: TransactionRepository
    ) {}

    async transfer(
        userId: string,
        fromAccountId: string,
        toAccountId: string,
        amount: number,
        idempotencyKey: string,
        description?: string
    ): Promise<Transaction> {
        // ========================================
        // Step 1: เช็ค idempotency -- Redis ก่อน
        // ========================================
        const cached = await getIdempotencyResult(idempotencyKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // ========================================
        // Step 2: เช็ค idempotency -- fallback DB
        // ========================================
        const existing =
            await this.transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing) {
            // เจอใน DB → cache กลับเข้า Redis ด้วย (เผื่อ Redis เพิ่งกลับมา)
            await saveIdempotencyResult(idempotencyKey, existing);
            return existing;
        }

        // ========================================
        // Step 3: Validate ห้ามโอนให้ตัวเอง
        // ========================================
        if (fromAccountId === toAccountId) {
            throw {
                code: 'SAME_ACCOUNT',
                message: 'Cannot transfer to the same account',
                statusCode: 400,
            };
        }

        // ========================================
        // Step 4: เริ่ม DB Transaction
        // ========================================
        const client = await getClient();

        try {
            await client.query('BEGIN');

            // ========================================
            // Step 5: Lock rows ตามลำดับ ID
            // ========================================
            // ทำไมต้อง lock ตามลำดับ?
            //
            // สมมติ:
            //   Transaction 1: A → B (lock A ก่อน แล้ว lock B)
            //   Transaction 2: B → A (lock B ก่อน แล้ว lock A)
            //
            //   T1 lock A ✓ → พยายาม lock B → B ถูก T2 lock อยู่ → รอ
            //   T2 lock B ✓ → พยายาม lock A → A ถูก T1 lock อยู่ → รอ
            //   → ทั้งคู่รอกันไม่มีวันจบ = DEADLOCK!
            //
            // แก้: lock ตาม ID (เรียงจากน้อยไปมาก) ทุกคนล็อกลำดับเดียวกัน
            //   T1: lock A → lock B
            //   T2: lock A → lock B (ต้องรอ T1 ปล่อย A ก่อน)
            //   → ไม่มีทาง deadlock

            const [firstId, secondId] =
                fromAccountId < toAccountId
                    ? [fromAccountId, toAccountId]
                    : [toAccountId, fromAccountId];

            const firstAccount =
                await this.accountRepository.findByIdForUpdate(firstId, client);
            const secondAccount =
                await this.accountRepository.findByIdForUpdate(secondId, client);

            // map กลับมาให้ถูกตัว
            const fromAccount =
                firstId === fromAccountId ? firstAccount : secondAccount;
            const toAccount =
                firstId === toAccountId ? firstAccount : secondAccount;

            // ========================================
            // Step 6: Validate accounts
            // ========================================
            if (!fromAccount) {
                throw {
                    code: 'ACCOUNT_NOT_FOUND',
                    message: 'Source account not found',
                    statusCode: 404,
                };
            }

            if (!toAccount) {
                throw {
                    code: 'ACCOUNT_NOT_FOUND',
                    message: 'Destination account not found',
                    statusCode: 404,
                };
            }

            // เช็คว่า from account เป็นของ user คนนี้
            if (fromAccount.userId !== userId) {
                throw {
                    code: 'FORBIDDEN',
                    message: 'You do not have access to the source account',
                    statusCode: 403,
                };
            }

            // เช็คว่า accounts active
            if (fromAccount.status !== 'active') {
                throw {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Source account is not active',
                    statusCode: 400,
                };
            }

            if (toAccount.status !== 'active') {
                throw {
                    code: 'ACCOUNT_INACTIVE',
                    message: 'Destination account is not active',
                    statusCode: 400,
                };
            }

            // เช็คยอดเงินเพียงพอ
            if (fromAccount.balance < amount) {
                throw {
                    code: 'INSUFFICIENT_BALANCE',
                    message: `Insufficient balance. Available: ${fromAccount.balance} THB`,
                    statusCode: 400,
                };
            }

            // ========================================
            // Step 7: Update balances
            // ========================================
            const newFromBalance = fromAccount.balance - amount;
            const newToBalance = toAccount.balance + amount;

            await this.accountRepository.updateBalance(
                fromAccountId,
                newFromBalance,
                client
            );
            await this.accountRepository.updateBalance(
                toAccountId,
                newToBalance,
                client
            );

            // ========================================
            // Step 8: Insert transaction record
            // ========================================
            const transaction = await this.transactionRepository.create(
                {
                    fromAccountId,
                    toAccountId,
                    amount,
                    type: 'transfer',
                    description,
                    idempotencyKey,
                },
                client
            );

            // ========================================
            // Step 9: COMMIT -- ทุกอย่างสำเร็จ
            // ========================================
            await client.query('COMMIT');

            // ========================================
            // Step 10: Cache idempotency result
            // ========================================
            await saveIdempotencyResult(idempotencyKey, transaction);

            return transaction;
        } catch (err) {
            // ถ้ามีอะไรผิดพลาด → ROLLBACK ทั้งหมด
            // balance ไม่เปลี่ยน, transaction ไม่ถูกบันทึก
            await client.query('ROLLBACK');
            throw err;
        } finally {
            // คืน connection กลับ pool เสมอ ไม่ว่าจะสำเร็จหรือล้มเหลว
            client.release();
        }
    }
}