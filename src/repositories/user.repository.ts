import { CreateUserDto, User } from '@/types/user.types';
import { query } from '@/utils/db.helper'

// SELECT ที่ alias ทุก column เป็น camelCase ให้ตรงกับ User interface
// ใช้ซ้ำทุก query ที่ return User
const USER_COLUMNS = `
    id,
    email,
    password_hash AS "passwordHash",
    full_name AS "fullName",
    phone_number AS "phoneNumber",
    national_id AS "nationalId",
    role,
    status,
    failed_login_attempts AS "failedLoginAttempts",
    locked_until AS "lockedUntil",
    last_login_at AS "lastLoginAt",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
`;

export class UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const result = await query(
            `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
            [email]
        );
        return result.rows[0] || null;
    }

    async create(data: CreateUserDto): Promise<User> {
        const { email, fullName, password, nationalId, phoneNumber } = data;
        const result = await query(
            `INSERT INTO users (email, full_name, password_hash, national_id, phone_number)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING ${USER_COLUMNS}`,
            [email, fullName, password, nationalId, phoneNumber]
        );
        if (!result.rows[0]) {
            throw new Error('Failed to create user');
        }
        return result.rows[0];
    }

    async updateLoginSuccess(userId: string): Promise<void> {
        await query(
            `UPDATE users
                SET failed_login_attempts = 0,
                    locked_until = NULL,
                    last_login_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1`,
            [userId]
        );
    }

    async incrementFailedLogin(userId: string): Promise<number> {
        const result = await query(
            `UPDATE users
                SET failed_login_attempts = failed_login_attempts + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING failed_login_attempts AS "failedLoginAttempts"`,
            [userId]
        );
        if (!result.rows[0]) {
            throw new Error('Failed to increment failed login attempts');
        }
        return result.rows[0].failedLoginAttempts;
    }

    async lockAccount(userId: string, lockMinutes: number): Promise<void> {
        await query(
            `UPDATE users
                SET locked_until = CURRENT_TIMESTAMP + INTERVAL '1 minute' * $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1`,
            [userId, lockMinutes]
        );
    }
}
