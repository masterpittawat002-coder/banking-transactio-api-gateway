import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '@services/transaction.service';
import { successResponse, errorResponse } from '@utils/response';
import { ApiError } from '@/types';


export class TransactionController {
    constructor(private transactionService: TransactionService) {}

    transfer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // ดึง idempotency key จาก header หรือ body
            const idempotencyKey =
                (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;

            if (!idempotencyKey) {
                res.status(400).json(
                    errorResponse({
                        code: 'IDEMPOTENCY_KEY_REQUIRED',
                        message: 'Idempotency-Key header is required for transfer requests',
                        statusCode: 400,
                    })
                );
                return;
            }

            const userId = (req as any).userId;
            const { fromAccountId, toAccountId, amount, description } = req.body;

            const result = await this.transactionService.transfer(
                userId,
                fromAccountId,
                toAccountId,
                amount,
                idempotencyKey,
                description
            );

            res.status(201).json(successResponse(result));
        } catch (err: any) {
            if (err.code && err.statusCode) {
                res.status(err.statusCode).json(errorResponse(err as ApiError));
                return;
            }
            next(err);
        }
    };
}