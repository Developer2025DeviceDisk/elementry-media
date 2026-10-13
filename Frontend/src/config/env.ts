import { z } from 'zod';

const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol));
const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
const schema = z.object({
  apiUrl: httpUrl,
  appUrl: httpUrl,
  commerce: flag,
  search: flag,
  admin: flag,
  passwordRecovery: flag,
});
export const env = schema.parse({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
  commerce: process.env.NEXT_PUBLIC_COMMERCE_API_ENABLED,
  search: process.env.NEXT_PUBLIC_SEARCH_API_ENABLED,
  admin: process.env.NEXT_PUBLIC_ADMIN_API_ENABLED,
  passwordRecovery: process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED,
});
