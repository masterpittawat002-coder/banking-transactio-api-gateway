/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/'],
    testTimeout: 30000,
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.jest.json',
            },
        ],
    },
    moduleNameMapper: {
        // uuid v13 เป็น pure ESM ที่ Jest run ไม่ได้
        // → map ไปใช้ stub แทน (ใช้ node:crypto.randomUUID)
        '^uuid$': '<rootDir>/tests/__mocks__/uuid.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        '^@repositories/(.*)$': '<rootDir>/src/repositories/$1',
        '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@validators/(.*)$': '<rootDir>/src/validators/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
    },
};
