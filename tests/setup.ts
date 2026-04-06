import { Pool } from 'pg';
import { config } from 'dotenv';

// โหลด .env.test
config({ path: '.env.test' });

let pool: Pool;

export const getTestPool = (): Pool => {
    if (!pool) {
        pool = new Pool({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
    }
    return pool;
};

// run migrations on test DB
export const setupTestDB = async (): Promise<void> => {
    const testPool = getTestPool();
    // อ่าน migration files แล้ว execute
    // หรือง่ายกว่า -- เรียก migrate script
};

// ลบ data ทุก table (แต่ไม่ drop table)
export const cleanTestDB = async (): Promise<void> => {
    const testPool = getTestPool();
    await testPool.query('DELETE FROM transactions');
    await testPool.query('DELETE FROM accounts');
    await testPool.query('DELETE FROM audit_logs');
    await testPool.query('DELETE FROM users');
};

// ปิด connection
export const teardownTestDB = async (): Promise<void> => {
    if (pool) {
        await pool.end();
    }
};