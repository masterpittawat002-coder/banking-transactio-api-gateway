import { z } from 'zod';

export const transferSchema = z.object({
    fromAccountId: z
        .string()
        .min(1, 'Source account ID is required')
        .uuid('Invalid source account ID format'),

    toAccountId: z
        .string()
        .min(1, 'Destination account ID is required')
        .uuid('Invalid destination account ID format'),

    amount: z
        .number({ message: 'Amount is required' })
        .positive('Amount must be a positive number')
        .max(10000000, 'Amount exceeds maximum transfer limit'),

    description: z
        .string()
        .max(500, 'Description must not exceed 500 characters')
        .optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;