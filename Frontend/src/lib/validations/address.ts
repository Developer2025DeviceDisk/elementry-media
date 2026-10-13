import { z } from 'zod';
export const addressSchema = z.object({
  name: z.string().trim().min(1, 'Enter a recipient name.').max(100),
  phone: z.string().regex(/^\+?[0-9 ()-]{7,20}$/, 'Enter a valid phone number.'),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(3).max(12),
  country: z.string().length(2),
});
