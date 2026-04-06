export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly details?: Record<string, any>;

    constructor(
        code: string,
        message: string,
        statusCode: number,
        details?: Record<string, any>
    ) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';

        // เก็บ stack trace ที่ถูกต้อง (เริ่มจากจุดที่ throw)
        Error.captureStackTrace(this, this.constructor);
    }
}