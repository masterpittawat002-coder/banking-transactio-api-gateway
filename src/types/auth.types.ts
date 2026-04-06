import { UserProfileDto } from "./user.types";

export interface RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    nationalId?: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginResponseDto {
    user: UserProfileDto;
    tokens: AuthTokens;
}