import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '@utils/response';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/errors';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // ถ้าเป็น AppError ของเรา (มี statusCode, code)
    if (err instanceof AppError) {
        logger.warn('Handled application error', {
            code: err.code,
            statusCode: err.statusCode,
            message: err.message,
            path: req.path,
            method: req.method,
        });

        res.status(err.statusCode).json(
            errorResponse({
                code: err.code,
                message: err.message,
                statusCode: err.statusCode,
            })
        );
        return;
    }

    // ถ้าเป็น error ที่เราไม่ได้คาดไว้ -- อันนี้น่ากลัว
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    res.status(500).json(
        errorResponse({
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            statusCode: 500,
        })
    );
};