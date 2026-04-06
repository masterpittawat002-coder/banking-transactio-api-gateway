import { AuthService } from '@/services/auth.service';
import { ApiError } from '@/types';
import { errorResponse, successResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express'

export class AuthController {
    constructor(private authService: AuthService) { }

    public health = async (req: Request, res: Response) => {
        try {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
              });
        } catch (err: any) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0',
                error: err.message,
            });
        }
    };

    public register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.register(req.body);
            res.status(201).json(successResponse(result));
        } catch (error: any) {
            if (error.statusCode) {
                res.status(error.statusCode).json(errorResponse(error));
            } else {
                next(error)
            }
        }
    };

    public login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.authService.login(req.body);
            res.status(200).json(successResponse(result));
        } catch (err: any) {
            if (err.code && err.statusCode) {
                res.status(err.statusCode).json(errorResponse(err));
                return;
            }
            next(err);
        }
    };

}