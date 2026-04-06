import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '@utils/response';

export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues
                    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                    .join(', ');

                res.status(400).json(
                    errorResponse({
                        code: 'VALIDATION_ERROR',
                        message,
                        statusCode: 400,
                    })
                );
                return;
            }
            next(error);
        }
    }
}