import { Transaction } from '@/types/transaction.types';
import { query } from '@utils/db.helper';
import { PoolClient } from 'pg';

export class TransactionRepository {
    public async create(
        data: {
            fromAccountId: string;
            toAccountId: string;
            amount: number;
            type: string;
            description?: string;
            idempotencyKey?: string;
        },
        client: PoolClient
    ): Promise<Transaction> {
        const result = await client.query(
            `INSERT INTO transactions
                (from_account_id, to_account_id, amount, type, description, idempotency_key)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, from_account_id, to_account_id, amount, currency,
                       type, status, description, idempotency_key,
                       reference_number, created_at, updated_at`,
            [
                data.fromAccountId,
                data.toAccountId,
                data.amount,
                data.type,
                data.description || null,
                data.idempotencyKey || null,
            ]
        );

        return this.mapToTransaction(result.rows[0]);
    }

    public async findByIdempotencyKey(key: string): Promise<Transaction | null> {
        const result = await query(
            `SELECT id, from_account_id, to_account_id, amount, currency,
                    type, status, description, idempotency_key,
                    reference_number, created_at, updated_at
             FROM transactions
             WHERE idempotency_key = $1`,
            [key]
        );

        if (result.rows.length === 0) return null;

        return this.mapToTransaction(result.rows[0]);
    }

    private mapToTransaction(row: any): Transaction {
        return {
            id: row.id,
            fromAccountId: row.from_account_id,
            toAccountId: row.to_account_id,
            amount: parseFloat(row.amount),
            currency: row.currency,
            type: row.type,
            status: row.status,
            description: row.description,
            idempotencyKey: row.idempotency_key,
            referenceNumber: row.reference_number,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}