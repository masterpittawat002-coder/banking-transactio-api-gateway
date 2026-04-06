import { UserRepository } from "@/repositories/user.repository";
import { AuthTokens, LoginDto, LoginResponseDto, RegisterDto, UserProfileDto } from "@/types";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '@/config/app';


export class AuthService {
    constructor(private userRepo: UserRepository) { }

    async register(data: RegisterDto) {
        const existing = await this.userRepo.findByEmail(data.email);
        if (existing) {
            throw {
                code: 'EMAIL_ALREADY_EXISTS',
                message: 'This Email is already registered',
                statusCode: 409
            }
        };

        const passwordHash = await bcrypt.hash(data.password, 12);
        const user = await this.userRepo.create({
            email: data.email,
            fullName: data.fullName,
            password: passwordHash,
            nationalId: data.nationalId,
            phoneNumber: data.phoneNumber
        });

        const tokens = this.generateTokens(user.id, 'USER');

        const profile: UserProfileDto = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt
        };

        return { user: profile, tokens };
    }

    private generateTokens(userId: string, role: string): AuthTokens {
        const accessToken = jwt.sign(
            { userId, role },
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.expiresIn
            }
        );
        const refreshToken = jwt.sign(
            { userId, type: 'refresh' },
            jwtConfig.secret,
            {
                expiresIn: jwtConfig.refreshExpiresIn
            }
        );
        return { accessToken, refreshToken, expiresIn: 900 }
    }

    public async login(LoginRequestDto: LoginDto): Promise<LoginResponseDto> {
         // หา user จาก email
        const user = await this.userRepo.findByEmail(LoginRequestDto.email);
        if (!user) {
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                statusCode: 401
            }
        }
        // เช็คว่า account ถูก lock อยู่ไหม
        if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesLeft = Math.ceil(
                (new Date(user.lockedUntil).getTime() - Date.now()) / 60000
            );
            throw {
                code: 'ACCOUNT_LOCKED',
                message: `Account is locked. Try again in ${minutesLeft} minute(s)`,
                statusCode: 423
            }
        }
        const isMatch = await bcrypt.compare(LoginRequestDto.password, user.passwordHash);
        if (!isMatch) {
            // password ผิด → เพิ่ม failed attempts
            const failedAttempts = await this.userRepo.incrementFailedLogin(user.id);
            // ถ้า fail >=5 ครั้ง → lock 30 นาที
            if (failedAttempts >= 5) {
                await this.userRepo.lockAccount(user.id, 30);
                throw {
                    code: 'ACCOUNT_LOCKED',
                    message: 'Too many failed login attempts. Account is locked for 30 minutes.',
                    statusCode: 423
                }
            }
            // password ผิดแต่ยังไม่ครบ 5 ครั้ง → throw error ปกติ
            throw {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
                statusCode: 401
            }
        }
        // password ถูก → reset failed attempts + generate tokens
        await this.userRepo.updateLoginSuccess(user.id);
        const tokens = this.generateTokens(user.id, user.role);
        const profile: UserProfileDto = {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt
        };

        return { user: profile, tokens };
    }
}