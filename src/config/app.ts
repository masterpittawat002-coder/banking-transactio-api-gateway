import dotenv from 'dotenv';
import path from 'path';
import type { StringValue } from 'ms';

// โหลด .env ตาม NODE_ENV
// dev:local → .env.local, dev → .env.development, staging → .env.staging
const envFile = process.env.NODE_ENV === 'local_development'
    ? '.env.local'
    : `.env.${process.env.NODE_ENV || 'development'}`;

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const appConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
};

export const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'banking_gateway',
    user: process.env.DB_USER || 'postgres',  // ต้องตรงกับ POSTGRES_USER ใน docker-compose
    password: process.env.DB_PASSWORD || '',
};

export const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
};

export const jwtConfig = {
    secret: process.env.JWT_SECRET || 'change-me',
    expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,
    refreshExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as StringValue,
};