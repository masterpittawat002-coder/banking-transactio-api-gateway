export type TransactionType = 'deposit' | 'withdrawal' | 'transfer';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Transaction {
    id: string;
    fromAccountId: string | null;
    toAccountId: string | null;
    amount: number;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    description: string | null;
    idempotencyKey: string | null;
    referenceNumber: string;
    createdAt: string;
    updatedAt: string;
}

export interface TransferRequest {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description?: string;
}