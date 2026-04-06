import supertest from 'supertest';
import app from '../../src/app';
import { cleanTestDB, setupTestDB, teardownTestDB } from '../setup';

const request = supertest(app);

beforeAll(async () => {
    await setupTestDB();
});

afterEach(async () => {
    await cleanTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

describe('POST /api/v1/auth/register', () => {
    const validUser = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
    };

    it('should register successfully and return 201', async () => {
        const res = await request
            .post('/api/v1/auth/register')
            .send(validUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.email).toBe(validUser.email);
        expect(res.body.data.user.fullName).toBe(validUser.fullName);
        expect(res.body.data.user.role).toBe('customer');
        expect(res.body.data.tokens.accessToken).toBeDefined();
        expect(res.body.data.tokens.refreshToken).toBeDefined();

        // สำคัญ! ต้องไม่มี passwordHash กลับมา
        expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should return 409 when email already exists', async () => {
        // register ครั้งแรก
        await request.post('/api/v1/auth/register').send(validUser);

        // register ซ้ำ
        const res = await request
            .post('/api/v1/auth/register')
            .send(validUser);

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should return 400 for invalid email format', async () => {
        const res = await request
            .post('/api/v1/auth/register')
            .send({
                email: 'not-an-email',
                password: 'SecurePass123!',
                fullName: 'Test User',
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for weak password', async () => {
        const res = await request
            .post('/api/v1/auth/register')
            .send({
                email: 'test@example.com',
                password: '123',
                fullName: 'Test User',
            });

        expect(res.status).toBe(400);
    });
});

describe('POST /api/v1/auth/login', () => {
    const validUser = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User',
    };

    // register ก่อนทุก test ใน group นี้
    beforeEach(async () => {
        await request.post('/api/v1/auth/register').send(validUser);
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request
            .post('/api/v1/auth/login')
            .send({
                email: validUser.email,
                password: validUser.password,
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.tokens.accessToken).toBeDefined();
        expect(res.body.data.tokens.refreshToken).toBeDefined();
        expect(res.body.data.user.email).toBe(validUser.email);
    });

    it('should return 401 for wrong password', async () => {
        const res = await request
            .post('/api/v1/auth/login')
            .send({
                email: validUser.email,
                password: 'WrongPassword123!',
            });

        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
        const res = await request
            .post('/api/v1/auth/login')
            .send({
                email: 'nobody@example.com',
                password: 'SomePassword123!',
            });

        expect(res.status).toBe(401);
    });
});