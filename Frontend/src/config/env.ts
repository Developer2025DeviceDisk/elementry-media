import { z } from 'zod';

const httpUrl = z.url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol));
const optionalValue = (value: string | undefined) => value?.trim() || undefined;
const flag = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');
const schema = z.object({
  apiUrl: httpUrl.optional(),
  appUrl: httpUrl,
  commerce: flag,
  search: flag,
  admin: flag,
  passwordRecovery: flag,
});
export const env = schema.parse({
  apiUrl: optionalValue(process.env.NEXT_PUBLIC_API_URL),
  appUrl: optionalValue(process.env.NEXT_PUBLIC_APP_URL) ?? 'http://localhost:3001',
  commerce: optionalValue(process.env.NEXT_PUBLIC_COMMERCE_API_ENABLED),
  search: optionalValue(process.env.NEXT_PUBLIC_SEARCH_API_ENABLED),
  admin: optionalValue(process.env.NEXT_PUBLIC_ADMIN_API_ENABLED),
  passwordRecovery: optionalValue(process.env.NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED),
});
