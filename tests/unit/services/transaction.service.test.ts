import { TransactionService } from '@services/transaction.service';
import { AccountRepository } from '@repositories/account.repository';
import { TransactionRepository } from '@repositories/transaction.repository';

// mock idempotency
jest.mock('@utils/idempotency', () => ({
    getIdempotencyResult: jest.fn().mockResolvedValue(null),
    saveIdempotencyResult: jest.fn().mockResolvedValue(undefined),
}));

// mock db.helper -- ประกาศ mockClient ภายใน factory
// (jest.mock ถูก hoist ขึ้นบนสุด → ใช้ตัวแปรนอก factory ไม่ได้)
jest.mock('@utils/db.helper', () => {
    const client = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
    };
    return {
        __mockClient: client,  // expose ออกมาใช้ใน test
        query: jest.fn(),
        getClient: jest.fn().mockResolvedValue(client),
    };
});

// ดึง mockClient มาใช้ใน assertions
const mockClient = (require('@utils/db.helper') as any).__mockClient as {
    query: jest.Mock;
    release: jest.Mock;
};

describe('TransactionService', () => {
    let transactionService: TransactionService;
    let mockAccountRepo: jest.Mocked<AccountRepository>;
    let mockTransactionRepo: jest.Mocked<TransactionRepository>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAccountRepo = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
            findByIdForUpdate: jest.fn(),
            updateBalance: jest.fn(),
        } as any;

        mockTransactionRepo = {
            create: jest.fn(),
            findByIdempotencyKey: jest.fn().mockResolvedValue(null),
        } as any;

        transactionService = new TransactionService(
            mockAccountRepo,
            mockTransactionRepo
        );
    });

    it('should return cached result when idempotency key exists in Redis', async () => {
        const { getIdempotencyResult } = require('@utils/idempotency');
        const cachedTransaction = {
            id: 'txn-1',
            fromAccountId: 'acc-1',
            toAccountId: 'acc-2',
            amount: 1000,
            status: 'completed',
        };

        getIdempotencyResult.mockResolvedValueOnce(
            JSON.stringify(cachedTransaction)
        );

        const result = await transactionService.transfer(
            'user-1',
            'acc-1',
            'acc-2',
            1000,
            'existing-key'
        );

        expect(result).toEqual(cachedTransaction);
        // ต้อง verify ว่าไม่ได้ทำ transfer จริง
        expect(mockAccountRepo.findByIdForUpdate).not.toHaveBeenCalled();
    });

    it('should throw SAME_ACCOUNT when transferring to same account', async () => {
        await expect(
            transactionService.transfer(
                'user-1',
                'acc-1',
                'acc-1',  // account เดียวกัน!
                1000,
                'key-1'
            )
        ).rejects.toMatchObject({
            code: 'SAME_ACCOUNT',
            statusCode: 400,
        });
    });

    it('should throw INSUFFICIENT_BALANCE when balance is not enough', async () => {
        const fromAccount = {
            id: 'acc-1',
            userId: 'user-1',
            balance: 500,   // มีแค่ 500
            status: 'active',
        };

        const toAccount = {
            id: 'acc-2',
            userId: 'user-2',
            balance: 1000,
            status: 'active',
        };

        // เรียง ID ตามลำดับ
        mockAccountRepo.findByIdForUpdate
            .mockResolvedValueOnce(fromAccount as any)   // acc-1 (ID น้อยกว่า)
            .mockResolvedValueOnce(toAccount as any);     // acc-2

        await expect(
            transactionService.transfer(
                'user-1',
                'acc-1',
                'acc-2',
                1000,   // โอน 1000 แต่มีแค่ 500
                'key-2'
            )
        ).rejects.toMatchObject({
            code: 'INSUFFICIENT_BALANCE',
            statusCode: 400,
        });

        // ต้อง ROLLBACK
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        // ต้อง release connection
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('should complete transfer successfully', async () => {
        const fromAccount = {
            id: 'acc-1',
            userId: 'user-1',
            balance: 5000,
            status: 'active',
        };

        const toAccount = {
            id: 'acc-2',
            userId: 'user-2',
            balance: 1000,
            status: 'active',
        };

        mockAccountRepo.findByIdForUpdate
            .mockResolvedValueOnce(fromAccount as any)
            .mockResolvedValueOnce(toAccount as any);

        const mockTransaction = {
            id: 'txn-1',
            fromAccountId: 'acc-1',
            toAccountId: 'acc-2',
            amount: 2000,
            type: 'transfer',
            status: 'completed',
        };

        mockTransactionRepo.create.mockResolvedValue(mockTransaction as any);

        const result = await transactionService.transfer(
            'user-1',
            'acc-1',
            'acc-2',
            2000,
            'key-3',
            'Test transfer'
        );

        expect(result.id).toBe('txn-1');
        expect(result.amount).toBe(2000);

        // เช็คว่า balance ถูก update
        expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith(
            'acc-1',
            3000,  // 5000 - 2000
            mockClient
        );
        expect(mockAccountRepo.updateBalance).toHaveBeenCalledWith(
            'acc-2',
            3000,  // 1000 + 2000
            mockClient
        );

        // ต้อง COMMIT
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        expect(mockClient.release).toHaveBeenCalled();
    });
});