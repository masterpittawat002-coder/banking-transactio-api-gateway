import { AccountRepository } from '@repositories/account.repository';
import { Account, CreateAccountRequest } from '@/types/account.types';

export class AccountService {
    constructor(private accountRepository: AccountRepository) {}

    async createAccount(
        userId: string,
        data: CreateAccountRequest
    ): Promise<Account> {
        // เช็ค minimum deposit ตามประเภท account
        const minimumDeposit: Record<string, number> = {
            savings: 500,
            checking: 1000,
            business: 5000,
        };

        const required = minimumDeposit[data.accountType] || 0;
        const deposit = data.initialDeposit || 0;

        if (deposit > 0 && deposit < required) {
            throw {
                code: 'MINIMUM_DEPOSIT_REQUIRED',
                message: `Minimum initial deposit for ${data.accountType} account is ${required} THB`,
                statusCode: 400,
            };
        }

        return this.accountRepository.create(userId, data.accountType, deposit);
    }

    async getAccounts(userId: string): Promise<Account[]> {
        return this.accountRepository.findByUserId(userId);
    }

    async getAccountById(userId: string, accountId: string): Promise<Account> {
        const account = await this.accountRepository.findById(accountId);

        if (!account) {
            throw {
                code: 'ACCOUNT_NOT_FOUND',
                message: 'Account not found',
                statusCode: 404,
            };
        }

        // เช็ค ownership -- customer เห็นแค่ account ตัวเอง
        if (account.userId !== userId) {
            throw {
                code: 'FORBIDDEN',
                message: 'You do not have access to this account',
                statusCode: 403,
            };
        }

        return account;
    }
}