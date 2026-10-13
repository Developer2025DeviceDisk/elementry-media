import { z } from 'zod';
const email = z
  .email('Enter a valid email address.')
  .max(254)
  .transform((value) => value.trim().toLowerCase());
const password = z.string().min(12, 'Use at least 12 characters.').max(128);
export const loginSchema = z.object({ email, password });
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(1, 'Enter your name.').max(100),
});
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match.',
  });
export const profileSchema = z.object({ name: z.string().trim().min(1).max(100) });
