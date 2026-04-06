export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests/integration'],
    setupFilesAfterSetup: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000, // integration test ช้ากว่า unit test
    moduleNameMapper: {
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
        // ... path aliases
    },
};