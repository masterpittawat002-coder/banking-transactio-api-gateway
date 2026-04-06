import { Account } from '@/types/account.types';
import { query, getClient } from '@utils/db.helper';
import { PoolClient } from 'pg';

export class AccountRepository {
    public async create(
        userId: string,
        accountType: string,
        balance: number
    ): Promise<Account> {
        const result = await query(
            `INSERT INTO accounts (user_id, account_type, balance)
             VALUES ($1, $2, $3)
             RETURNING id, user_id, account_number, account_type,
                       balance, currency, status, created_at, updated_at`,
            [userId, accountType, balance]
        );

        return this.mapToAccount(result.rows[0]);
    }

    public async findByUserId(userId: string): Promise<Account[]> {
        const result = await query(
            `SELECT id, user_id, account_number, account_type,
                    balance, currency, status, created_at, updated_at
             FROM accounts
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        return result.rows.map((row: any) => this.mapToAccount(row));
    }

    public async findById(id: string): Promise<Account | null> {
        const result = await query(
            `SELECT id, user_id, account_number, account_type,
                    balance, currency, status, created_at, updated_at
             FROM accounts
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) return null;

        return this.mapToAccount(result.rows[0]);
    }

    public async findByIdForUpdate(id: string, client: PoolClient): Promise<Account | null> {
        const result = await client.query(
            `SELECT id, user_id, account_number, account_type,
                balance, currency, status, created_at, updated_at
             FROM accounts
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );
    
        if (result.rows.length === 0) return null;
    
        return this.mapToAccount(result.rows[0]);
    }

    public async updateBalance(
        id: string,
        newBalance: number,
        client: PoolClient
    ): Promise<void> {
        await client.query(
            `UPDATE accounts
             SET balance = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id, newBalance]
        );
    }

    private mapToAccount(row: any): Account {
        return {
            id: row.id,
            userId: row.user_id,
            accountNumber: row.account_number,
            accountType: row.account_type,
            balance: parseFloat(row.balance),
            currency: row.currency,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}