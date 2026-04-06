export type AccountType = 'savings' | 'checking' | 'business';
export type AccountStatus = 'active' | 'inactive' | 'frozen' | 'closed';

export interface Account {
    id: string;
    userId: string;
    accountNumber: string;
    accountType: AccountType;
    balance: number;
    currency: string;
    status: AccountStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAccountRequest {
    accountType: AccountType;
    initialDeposit?: number;
}