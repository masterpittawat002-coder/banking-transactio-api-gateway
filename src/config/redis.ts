import { createClient } from 'redis';
import { redisConfig } from './app';

const useTls = process.env.NODE_ENV === 'production' || process.env.REDIS_TLS === 'true';

export const redisClient = createClient({
    socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        ...(useTls ? { tls: true as const } : {}),
    },
    password: redisConfig.password || undefined,
});

redisClient.on('error', (err) => {
    console.error('Redis error:', err.message);
});

redisClient.on('connect', () => {
    console.log('Redis connected');
});