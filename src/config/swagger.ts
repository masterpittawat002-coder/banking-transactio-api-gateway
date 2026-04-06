import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Banking Transaction API Gateway',
            version: '1.0.0',
            description: 'API สำหรับจัดการบัญชีธนาคารและธุรกรรม',
        },
        servers: [
            {
                url: '/api/v1',
                description: 'API v1',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                // ============================================
                // Common Response Schemas
                // ============================================
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'VALIDATION_ERROR' },
                                message: { type: 'string', example: 'Invalid input' },
                                statusCode: { type: 'number', example: 400 },
                            },
                        },
                        requestId: { type: 'string', format: 'uuid' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        data: { type: 'object' },
                        requestId: { type: 'string', format: 'uuid' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },

                // ============================================
                // User / Auth Schemas
                // ============================================
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        fullName: { type: 'string' },
                        phoneNumber: { type: 'string', nullable: true },
                        role: {
                            type: 'string',
                            enum: ['customer', 'teller', 'admin'],
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'suspended', 'pending_verification'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                        expiresIn: { type: 'integer', example: 900 },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                        tokens: { $ref: '#/components/schemas/AuthTokens' },
                    },
                },

                // ============================================
                // Account Schemas
                // ============================================
                Account: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string', format: 'uuid' },
                        accountNumber: { type: 'string', example: 'ACC0123456789' },
                        accountType: {
                            type: 'string',
                            enum: ['savings', 'checking', 'business'],
                        },
                        balance: { type: 'number', format: 'float', example: 1500.50 },
                        currency: { type: 'string', example: 'THB' },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive', 'frozen', 'closed'],
                        },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },

                // ============================================
                // Transaction Schemas
                // ============================================
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        fromAccountId: { type: 'string', format: 'uuid', nullable: true },
                        toAccountId: { type: 'string', format: 'uuid', nullable: true },
                        amount: { type: 'number', format: 'float', example: 1000.00 },
                        currency: { type: 'string', example: 'THB' },
                        type: {
                            type: 'string',
                            enum: ['deposit', 'withdrawal', 'transfer'],
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'completed', 'failed', 'reversed'],
                        },
                        description: { type: 'string', nullable: true },
                        idempotencyKey: { type: 'string', nullable: true },
                        referenceNumber: { type: 'string', example: 'TXN20260406000001' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    },

    // detect runtime: ถ้าเรารันจาก .js แสดงว่าเป็น compiled build (production / staging / dev บน Render)
    // ถ้ารันจาก .ts แสดงว่าเป็น ts-node-dev (local dev)
    // วิธีนี้ robust กว่าการเช็ค NODE_ENV เพราะ NODE_ENV อาจเป็น staging / development ที่ Render
    apis: __filename.endsWith('.js')
        ? ['./dist/routes/*.js', './dist/controllers/*.js']
        : ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);