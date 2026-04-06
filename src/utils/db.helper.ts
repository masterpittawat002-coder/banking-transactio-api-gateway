import { pool } from "@/config/database";

const CONNECTION_ERROR_CODES = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    '57P01',
]

async function withDbError<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    } catch (err: any) {
        if (CONNECTION_ERROR_CODES.includes(err.code)) {
            throw {
                code: 'DATABASE_UNAVAILABLE',
                message: 'Database is currently unavailable. Please try again later.',
                statusCode: 503,
            };
        }
        throw err;
    }
}

export const query = (text: string, params?: any[]) => {
    return withDbError(() => pool.query(text, params));
}

export const getClient = () => {
    return withDbError(() => pool.connect());
}
