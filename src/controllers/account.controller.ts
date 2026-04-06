import { Request, Response, NextFunction } from 'express';
import { AccountService } from '@services/account.service';
import { successResponse, errorResponse } from '@utils/response';
import { ApiError } from '@/types/common.types';


export class AccountController {
    constructor(private accountService: AccountService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).userId;
            const result = await this.accountService.createAccount(userId, req.body);

            res.status(201).json(successResponse(result));
        } catch (err: any) {
            if (err.code && err.statusCode) {
                res.status(err.statusCode).json(errorResponse(err as ApiError));
                return;
            }
            next(err);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).userId;
            const result = await this.accountService.getAccounts(userId);

            res.status(200).json(successResponse(result));
        } catch (err: any) {
            if (err.code && err.statusCode) {
                res.status(err.statusCode).json(errorResponse(err as ApiError));
                return;
            }
            next(err);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = (req as any).userId;
            const accountId = (req as any).params.id;
            const result = await this.accountService.getAccountById(userId, accountId);

            res.status(200).json(successResponse(result));
        } catch (err: any) {
            if (err.code && err.statusCode) {
                res.status(err.statusCode).json(errorResponse(err as ApiError));
                return;
            }
            next(err);
        }
    };
}