import { Router } from 'express';
import { AccountRepository } from '@repositories/account.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { TransactionService } from '@services/transaction.service';
import { TransactionController } from '@controllers/transaction.controller';
import { authMiddleware } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validator.middleware';
import { transferSchema } from '../validators/transaction.validator';

const router = Router();

// สร้าง instance chain
const accountRepository = new AccountRepository();
const transactionRepository = new TransactionRepository();
const transactionService = new TransactionService(
    accountRepository,
    transactionRepository
);
const transactionController = new TransactionController(transactionService);

// ทุก route ต้อง login
router.use(authMiddleware);

/**
 * @openapi
 * tags:
 *   - name: Transactions
 *     description: ธุรกรรมทางการเงิน — ต้อง login ก่อนทุก endpoint
 */

/**
 * @openapi
 * /transactions/transfer:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Transfer money between accounts
 *     description: |
 *       โอนเงินจากบัญชีตัวเองไปอีกบัญชี
 *
 *       **Idempotency:**
 *       - ส่ง `idempotencyKey` ที่ไม่ซ้ำ (UUID v4 แนะนำ)
 *       - ถ้า key เดิมถูกส่งซ้ำ → return ผลลัพธ์เดิมทันที (ไม่โอนซ้ำ)
 *
 *       **Concurrency:**
 *       - ใช้ `SELECT FOR UPDATE` lock 2 บัญชีพร้อมกัน
 *       - ป้องกัน race condition กรณีโอนพร้อมกัน
 *
 *       **Database transaction:**
 *       - ทำเป็น single DB transaction
 *       - ถ้า error กลางทาง → rollback ทุก operation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fromAccountId
 *               - toAccountId
 *               - amount
 *               - idempotencyKey
 *             properties:
 *               fromAccountId:
 *                 type: string
 *                 format: uuid
 *                 description: บัญชีต้นทาง (ต้องเป็นของ user ที่ login)
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               toAccountId:
 *                 type: string
 *                 format: uuid
 *                 description: บัญชีปลายทาง
 *                 example: 660e8400-e29b-41d4-a716-446655440001
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: จำนวนเงินที่จะโอน (ต้อง > 0)
 *                 example: 500.00
 *               description:
 *                 type: string
 *                 description: หมายเหตุการโอน
 *                 example: ค่าอาหาร
 *               idempotencyKey:
 *                 type: string
 *                 description: Unique key ป้องกัน duplicate transaction
 *                 example: 770e8400-e29b-41d4-a716-446655440002
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: |
 *           Validation error เช่น
 *           - amount <= 0
 *           - same account (fromAccountId == toAccountId)
 *           - insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               sameAccount:
 *                 summary: โอนให้บัญชีตัวเอง
 *                 value:
 *                   success: false
 *                   error:
 *                     code: SAME_ACCOUNT
 *                     message: Cannot transfer to the same account
 *                     statusCode: 400
 *               insufficientBalance:
 *                 summary: เงินไม่พอ
 *                 value:
 *                   success: false
 *                   error:
 *                     code: INSUFFICIENT_BALANCE
 *                     message: Insufficient balance
 *                     statusCode: 400
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (fromAccount ไม่ใช่ของ user ที่ login)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/transfer', validate(transferSchema), transactionController.transfer);

export default router;
