import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ApiError } from '@/types/common.types';

export const successResponse = <T>(data: T): ApiResponse<T> => {
    return {
        success: true,
        data,
        requestId: uuidv4(),
        timestamp: new Date().toISOString()
    };
}

export const errorResponse = (error: ApiError): ApiResponse => {
    return {
        success: false,
        error,
        requestId: uuidv4(),
        timestamp: new Date().toISOString()
    };
}