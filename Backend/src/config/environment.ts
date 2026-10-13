import { z } from 'zod';
import { MongoClient } from 'mongodb';

const mongoUri = z.string().min(1).refine((value) => {
  try {
    // MongoDB URIs may contain multiple replica-set hosts, unlike standard URLs.
    new MongoClient(value);
    return true;
  } catch { return false; }
}, 'Must be a MongoDB connection URI');
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI: mongoUri,
  MONGODB_DATABASE: z.string().min(1).max(38).regex(/^[A-Za-z0-9_-]+$/).default('elementry'),
  REDIS_URL: z.string().url().refine((value) => /^rediss?:/.test(value), 'Must be a Redis URL'),
  REDIS_PREFIX: z.string().min(1).default('commerce:dev:'),
  APP_ORIGINS: z.string().min(1).transform((value) => value.split(',').map((v) => v.trim())).refine(
    (origins) => origins.every((origin) => {
      try { const url = new URL(origin); return ['http:', 'https:'].includes(url.protocol) && url.origin === origin; }
      catch { return false; }
    }), 'Use exact HTTP(S) origins without paths or trailing slashes',
  ),
  SESSION_SECRET: z.string().min(32).refine((value) => !value.startsWith('replace-'), 'Generate a random session secret'),
  SESSION_TTL_SECONDS: z.coerce.number().int().min(60).max(604800).default(86400),
  SESSION_ABSOLUTE_TTL_SECONDS: z.coerce.number().int().min(60).max(2592000).default(604800),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  TRUST_PROXY: z.string().default('').refine((v) => !['true', '*', '1'].includes(v), 'Use trusted proxy addresses or CIDRs'),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  CACHE_TTL_SECONDS: z.coerce.number().int().min(1).max(3600).default(60),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
}).superRefine((env, ctx) => {
  const issue = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
  if (env.SESSION_ABSOLUTE_TTL_SECONDS < env.SESSION_TTL_SECONDS) issue('SESSION_ABSOLUTE_TTL_SECONDS', 'Must be at least the idle timeout');
  if (env.COOKIE_SAME_SITE === 'none' && env.NODE_ENV !== 'production') issue('COOKIE_SAME_SITE', 'SameSite=None requires production HTTPS cookies');
  if (env.NODE_ENV === 'production') {
    if (env.APP_ORIGINS.some((v) => !v.startsWith('https://'))) issue('APP_ORIGINS', 'Production requires HTTPS origins');
    if (!env.REDIS_URL.startsWith('rediss://')) issue('REDIS_URL', 'Production requires Redis TLS');
    const searchParams = new URLSearchParams(env.MONGODB_URI.split('?')[1] ?? '');
    const options = new Map([...searchParams].map(([key, value]) => [key.toLowerCase(), value.toLowerCase()]));
    const encrypted = options.get('tls') === 'true' || options.get('ssl') === 'true' || env.MONGODB_URI.startsWith('mongodb+srv:');
    if (!encrypted || ['tls', 'ssl'].some(key => options.get(key) === 'false')) issue('MONGODB_URI', 'Production requires MongoDB TLS');
    if (['tlsinsecure', 'tlsallowinvalidcertificates', 'tlsallowinvalidhostnames'].some(key => options.get(key) === 'true')) issue('MONGODB_URI', 'MongoDB TLS verification must remain enabled');
    if (env.REDIS_PREFIX === 'commerce:dev:') issue('REDIS_PREFIX', 'Use an environment-specific production prefix');
  }
});

export type Environment = z.infer<typeof envSchema>;
export function validateEnvironment(input: Record<string, unknown>): Environment {
  const result = envSchema.safeParse(input);
  if (!result.success) {
    // Never print supplied values: connection URLs contain credentials.
    throw new Error(`Invalid configuration: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`);
  }
  return result.data;
}
