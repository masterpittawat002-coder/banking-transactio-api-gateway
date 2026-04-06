import { z } from 'zod';

export const createAccountSchema = z.object({
    accountType: z
        .enum(['savings', 'checking', 'business'], {
            message: 'Account type is required',
        }),

    initialDeposit: z
        .number('Initial deposit must be a number')
        .min(0, 'Initial deposit cannot be negative')
        .optional()
        .default(0),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;