import { createClient } from 'redis';
import { redisConfig } from './app';

// production (Upstash, Redis Cloud) → ใช้ TLS
// dev (local Docker) → ไม่ใช้ TLS
const useTls = process.env.NODE_ENV === 'production' || process.env.REDIS_TLS === 'true';

export const redisClient = createClient({
    socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        tls: useTls,
    },
    password: redisConfig.password || undefined,
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});