import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';

// field ที่ไม่ควรโชว์ใน log
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken'];

const maskSensitive = (obj: Record<string, any>): Record<string, any> => {
    const masked = { ...obj };
    for (const key of Object.keys(masked)) {
        if (SENSITIVE_FIELDS.includes(key)) {
            masked[key] = '***REDACTED***';
        }
    }
    return masked;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // ใช้ event 'finish' แทนการ override res.end
    // → สะอาดกว่า, ไม่มีปัญหา type
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData: Record<string, any> = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
        };

        // ถ้ามี userId จาก auth middleware
        if ((req as any).user?.id) {
            logData.userId = (req as any).user.id;
        }

        // log body เฉพาะ POST/PUT/PATCH (mask sensitive fields)
        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
            logData.body = maskSensitive(req.body);
        }

        // เลือก log level ตาม status code
        if (res.statusCode >= 500) {
            logger.error('Request completed with server error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request completed with client error', logData);
        } else {
            logger.http('Request completed', logData);
        }
    });

    next();
};
