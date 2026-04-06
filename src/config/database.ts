import { Pool, PoolConfig } from 'pg';
import { dbConfig } from './app';

// ถ้ามี DATABASE_URL (เช่น Render Managed Postgres) จะใช้ตัวนั้นก่อน
// fallback ไปใช้ DB_HOST/DB_PORT/... ถ้าไม่มี
const useUrl = !!process.env.DATABASE_URL;

const config: PoolConfig = useUrl
    ? {
          connectionString: process.env.DATABASE_URL,
          // Render Managed Postgres ต้องใช้ SSL สำหรับ external connection
          // internal connection (host = dpg-xxx-a) ก็รองรับ SSL ได้ — ใช้ทั้งคู่ได้ปลอดภัยกว่า
          ssl: process.env.DATABASE_URL!.includes('localhost')
              ? false
              : { rejectUnauthorized: false },
          max: 20,
      }
    : {
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
          password: dbConfig.password,
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
          max: 20,
      };

export const pool = new Pool(config);
