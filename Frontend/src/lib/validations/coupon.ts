import { z } from 'zod';
export const couponSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{3,32}$/),
  percentOff: z.number().min(1).max(100),
  expiresAt: z
    .string()
    .min(1)
    .refine((value) => Date.parse(value) > Date.now(), 'Choose a future expiry date.'),
});
