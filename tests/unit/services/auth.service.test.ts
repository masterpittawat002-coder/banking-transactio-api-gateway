import { AuthService } from '@/services/auth.service';
import { UserRepository } from '@/repositories/user.repository';
import { User } from '@/types';
import bcrypt from 'bcryptjs'

// mock bcryptjs — ไม่ต้อง hash จริง เสียเวลาเปล่า
jest.mock('bcryptjs', () => ({
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
}));

// mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-token'),
}));

describe('AuthService', () => {
    let authService: AuthService;
    let mockUserRepository: jest.Mocked<UserRepository>;

    beforeEach(() => {
        // mock repository — ทุก method เป็น jest.fn()
        mockUserRepository = {
            findByEmail: jest.fn(),
            create: jest.fn(),
            updateLoginSuccess: jest.fn(),
            incrementFailedLogin: jest.fn(),
            lockAccount: jest.fn(),
        } as any;

        authService = new AuthService(mockUserRepository);
    });

    describe('register', () => {
        // mock user ต้องมี field ครบตาม User interface
        const mockUser: User = {
            id: 'user-uuid-123',
            email: 'new@example.com',
            passwordHash: 'hashed-password',
            fullName: 'New User',
            role: 'customer',
            status: 'active',
            failedLoginAttempts: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const registerData = {
            email: 'new@example.com',
            password: 'Test1234',
            fullName: 'New User',
        };

        it('register สำเร็จถ้า email ใหม่', async () => {
            // Arrange — findByEmail หาไม่เจอ (email ยังไม่มี)
            mockUserRepository.findByEmail.mockResolvedValue(null);
            mockUserRepository.create.mockResolvedValue(mockUser);

            // Act
            const result = await authService.register(registerData);

            // Assert
            expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: 'new@example.com',
                password: 'hashed-password',
                fullName: 'New User',
                nationalId: undefined,
                phoneNumber: undefined,
            });
            expect(result.user.email).toBe('new@example.com');
            expect(result.user.fullName).toBe('New User');
            // profile ต้องไม่มี passwordHash!
            expect(result.user).not.toHaveProperty('passwordHash');
            expect(result.tokens.accessToken).toBe('mock-token');
            expect(result.tokens.refreshToken).toBe('mock-token');
        });

        it('throw EMAIL_ALREADY_EXISTS ถ้า email ซ้ำ', async () => {
            // Arrange — findByEmail เจอ user อยู่แล้ว
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);

            // Act & Assert
            await expect(authService.register(registerData)).rejects.toMatchObject({
                code: 'EMAIL_ALREADY_EXISTS',
                statusCode: 409,
            });

            // create ต้องไม่ถูกเรียก
            expect(mockUserRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('Login', () => {
        it('should login successfully with correct credentials', async () => {
            const mockUser: User = {
                id: 'user-1',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                fullName: 'Test User',
                role: 'customer',
                status: 'active',
                lockedUntil: null,
                failedLoginAttempts: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
    
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            mockUserRepository.updateLoginSuccess.mockResolvedValue(undefined);

            const result = await authService.login({
                email: 'test@example.com',
                password: 'Password123!',
            });
            expect(result.user.email).toBe('test@example.com');
            expect(result.tokens.accessToken).toBe('mock-token');
            expect(mockUserRepository.updateLoginSuccess).toHaveBeenCalledWith('user-1');
        });

        it('should throw INVALID_CREDENTIALS when password is wrong', async () => {
            const mockUser: User = {
                id: 'user-1',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                fullName: 'Test User',
                role: 'customer',
                status: 'active',
                lockedUntil: null,
                failedLoginAttempts: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
    
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            const bcrypt = require('bcryptjs');
            bcrypt.compare = jest.fn().mockResolvedValue(false);
            mockUserRepository.incrementFailedLogin.mockResolvedValue(1);
    
            await expect(
                authService.login({
                    email: 'test@example.com',
                    password: 'WrongPassword',
                })
            ).rejects.toMatchObject({
                code: 'INVALID_CREDENTIALS',
                statusCode: 401,
            });
        });
    
        it('should lock account after 5 failed attempts', async () => {
            const mockUser: User = {
                id: 'user-1',
                email: 'test@example.com',
                passwordHash: 'hashed-password',
                fullName: 'Test User',
                role: 'customer',
                status: 'active',
                lockedUntil: null,
                failedLoginAttempts: 4,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
    
            mockUserRepository.findByEmail.mockResolvedValue(mockUser);
            const bcrypt = require('bcryptjs');
            bcrypt.compare = jest.fn().mockResolvedValue(false);
            // ครั้งที่ 5 → incrementFailedLogin return 5
            mockUserRepository.incrementFailedLogin.mockResolvedValue(5);
            mockUserRepository.lockAccount.mockResolvedValue(undefined);
    
            await expect(
                authService.login({
                    email: 'test@example.com',
                    password: 'WrongPassword',
                })
            ).rejects.toMatchObject({
                code: 'ACCOUNT_LOCKED',
                statusCode: 423,
            });
    
            expect(mockUserRepository.lockAccount).toHaveBeenCalledWith('user-1', 30);
        });
    });
});