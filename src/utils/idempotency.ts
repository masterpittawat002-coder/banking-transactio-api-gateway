import { redisClient } from '@config/redis';

const IDEMPOTENCY_TTL = 60 * 60 * 24;  // 24 ชั่วโมง

export const getIdempotencyResult = async (
    key: string
): Promise<string | null> => {
    try {
        if (!redisClient.isReady) return null;
        return await redisClient.get(`idempotency:${key}`);
    } catch {
        // Redis ล่ม → return null (จะไป fallback เช็คจาก DB)
        return null;
    }
};

export const saveIdempotencyResult = async (
    key: string,
    result: object
): Promise<void> => {
    try {
        if (!redisClient.isReady) return;
        await redisClient.set(
            `idempotency:${key}`,
            JSON.stringify(result),
            { EX: IDEMPOTENCY_TTL }
        );
    } catch {
        // Redis ล่ม → ไม่ cache ก็ไม่เป็นไร DB ก็มี idempotency_key อยู่
    }
};