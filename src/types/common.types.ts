export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    requestId: string;
    timestamp: string;
}

export interface ApiError {
    code: string;
    message: string;
    statusCode: number;
    details?: Record<string, any>;
}