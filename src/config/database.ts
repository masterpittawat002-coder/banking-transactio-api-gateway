import { Pool } from 'pg';
import { dbConfig } from './app';

export const pool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    max: 20,
});
