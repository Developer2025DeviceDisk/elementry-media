import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAppUrl } from '@/config/app-url';

const publicVariables = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_COMMERCE_API_ENABLED',
  'NEXT_PUBLIC_SEARCH_API_ENABLED',
  'NEXT_PUBLIC_ADMIN_API_ENABLED',
  'NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED',
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('deployment environment', () => {
  it.each([undefined, '', '  '])('loads without public configuration (%s)', async (value) => {
    vi.resetModules();
    publicVariables.forEach((name) => vi.stubEnv(name, value));
    const { env } = await import('@/config/env');
    expect(env).toEqual({
      apiUrl: undefined,
      appUrl: 'http://localhost:3001',
      commerce: false,
      search: false,
      admin: false,
      passwordRecovery: false,
    });
  });

  it('embeds the Vercel domain as the public app URL', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'elementry.example');
    vi.stubEnv('VERCEL_URL', 'elementry-preview.vercel.app');
    const { default: config } = await import('../../next.config');
    expect(config.env?.NEXT_PUBLIC_APP_URL).toBe('https://elementry.example');
  });

  it.each([undefined, '', '  '])('defaults builds to the Render backend (%s)', async (value) => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_URL', value);
    const { default: config } = await import('../../next.config');
    expect(config.env?.NEXT_PUBLIC_API_URL).toBe('https://elementry-media.onrender.com/api/v1');
  });

  it('preserves explicit backend overrides for local and fixture builds', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_URL', ' http://localhost:4102/api/v1 ');
    const { default: config } = await import('../../next.config');
    expect(config.env?.NEXT_PUBLIC_API_URL).toBe('http://localhost:4102/api/v1');
  });

  it('prefers an explicit site URL and falls back to the deployment domain', () => {
    expect(
      resolveAppUrl({ appUrl: ' https://elementry.example ', productionDomain: 'other.example' }),
    ).toBe('https://elementry.example');
    expect(resolveAppUrl({ productionDomain: ' ', deploymentDomain: 'preview.vercel.app' })).toBe(
      'https://preview.vercel.app',
    );
    expect(resolveAppUrl({})).toBe('http://localhost:3001');
  });

  it.each([
    ['NEXT_PUBLIC_API_URL', 'api.example/api/v1'],
    ['NEXT_PUBLIC_API_URL', 'ftp://api.example'],
    ['NEXT_PUBLIC_APP_URL', 'site.example'],
    ['NEXT_PUBLIC_SEARCH_API_ENABLED', 'yes'],
  ])('rejects invalid nonempty %s', async (name, value) => {
    vi.resetModules();
    vi.stubEnv(name, value);
    await expect(import('@/config/env')).rejects.toThrow();
  });

  it('trims configured URLs and flags', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_API_URL', ' https://api.example/api/v1 ');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', ' https://elementry.example ');
    vi.stubEnv('NEXT_PUBLIC_SEARCH_API_ENABLED', ' true ');
    const { env } = await import('@/config/env');
    expect(env.apiUrl).toBe('https://api.example/api/v1');
    expect(env.appUrl).toBe('https://elementry.example');
    expect(env.search).toBe(true);
  });
});
