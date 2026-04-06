import { AccountService } from '@services/account.service';
import { AccountRepository } from '@repositories/account.repository';

describe('AccountService', () => {
    let accountService: AccountService;
    let mockAccountRepository: jest.Mocked<AccountRepository>;

    beforeEach(() => {
        mockAccountRepository = {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findById: jest.fn(),
        } as any;

        accountService = new AccountService(mockAccountRepository);
    });

    describe('createAccount', () => {
        it('should create savings account with sufficient deposit', async () => {
            const mockAccount = {
                id: 'acc-1',
                userId: 'user-1',
                accountNumber: 'ACC0000000001',
                accountType: 'savings' as const,
                balance: 1000,
                currency: 'THB',
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            mockAccountRepository.create.mockResolvedValue(mockAccount);

            const result = await accountService.createAccount('user-1', {
                accountType: 'savings',
                initialDeposit: 1000,
            });

            expect(result.accountType).toBe('savings');
            expect(result.balance).toBe(1000);
            expect(mockAccountRepository.create).toHaveBeenCalledWith(
                'user-1',
                'savings',
                1000
            );
        });

        it('should throw error when savings deposit is below minimum', async () => {
            await expect(
                accountService.createAccount('user-1', {
                    accountType: 'savings',
                    initialDeposit: 100,  // ต่ำกว่า 500
                })
            ).rejects.toMatchObject({
                code: 'MINIMUM_DEPOSIT_REQUIRED',
                statusCode: 400,
            });

            // ต้อง verify ว่า repository.create ไม่ถูกเรียก
            expect(mockAccountRepository.create).not.toHaveBeenCalled();
        });

        it('should allow zero deposit', async () => {
            const mockAccount = {
                id: 'acc-1',
                userId: 'user-1',
                accountNumber: 'ACC0000000001',
                accountType: 'savings' as const,
                balance: 0,
                currency: 'THB',
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            mockAccountRepository.create.mockResolvedValue(mockAccount);

            const result = await accountService.createAccount('user-1', {
                accountType: 'savings',
                initialDeposit: 0,
            });

            expect(result.balance).toBe(0);
        });
    });

    describe('getAccountById', () => {
        it('should return account when owned by user', async () => {
            const mockAccount = {
                id: 'acc-1',
                userId: 'user-1',  // ตรงกับ userId ที่ส่งเข้าไป
                accountNumber: 'ACC0000000001',
                accountType: 'savings' as const,
                balance: 50000,
                currency: 'THB',
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            mockAccountRepository.findById.mockResolvedValue(mockAccount);

            const result = await accountService.getAccountById('user-1', 'acc-1');
            expect(result.id).toBe('acc-1');
        });

        it('should throw FORBIDDEN when account belongs to another user', async () => {
            const mockAccount = {
                id: 'acc-1',
                userId: 'user-2',  // เป็นของ user-2
                accountNumber: 'ACC0000000001',
                accountType: 'savings' as const,
                balance: 50000,
                currency: 'THB',
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            mockAccountRepository.findById.mockResolvedValue(mockAccount);

            // user-1 พยายามดู account ของ user-2
            await expect(
                accountService.getAccountById('user-1', 'acc-1')
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                statusCode: 403,
            });
        });

        it('should throw ACCOUNT_NOT_FOUND when account does not exist', async () => {
            mockAccountRepository.findById.mockResolvedValue(null);

            await expect(
                accountService.getAccountById('user-1', 'nonexistent')
            ).rejects.toMatchObject({
                code: 'ACCOUNT_NOT_FOUND',
                statusCode: 404,
            });
        });
    });
});