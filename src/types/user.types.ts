export type UserRole = 'customer' | 'teller' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface CreateUserDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    nationalId?: string;
    role?: UserRole;
}

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phoneNumber?: string;
    nationalId?: string;
    role: UserRole;
    status: UserStatus;
    failedLoginAttempts: number;
    lockedUntil?: Date | null;
    lastLoginAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserProfileDto {
    id: string;
    email: string;
    fullName: string;
    phoneNumber?: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
}