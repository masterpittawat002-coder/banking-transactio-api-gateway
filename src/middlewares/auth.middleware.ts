import { jwtConfig } from '@/config/app';
import { errorResponse } from '@/utils/response';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
):void => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json(
                errorResponse({
                    code: 'NO_TOKEN',
                    message: 'Access token is required',
                    statusCode: 401,
                })
            );
            return;
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, jwtConfig.secret) as {
            userId: string;
            role: string;
        };

        req.userId = decoded.userId;
        req.userRole = decoded.role;

        next();
    }
    catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json(
                errorResponse({
                    code: 'TOKEN_EXPIRED',
                    message: 'Access token has expired',
                    statusCode: 401,
                })
            );
            return;
        }

        res.status(401).json(
            errorResponse({
                code: 'INVALID_TOKEN',
                message: 'Invalid access token',
                statusCode: 401,
            })
        );
    } 
};

export const authorize = (...allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.userRole || !allowedRoles.includes(req.userRole)) {
            res.status(403).json(
                errorResponse({
                    code: 'FORBIDDEN',
                    message: 'You do not have permission to perform this action',
                    statusCode: 403,
                })
            );
            return;
        }
        next();
    };
};