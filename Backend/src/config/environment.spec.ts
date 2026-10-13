import { validateEnvironment } from './environment';

const valid = {
  MONGODB_URI: 'mongodb://127.0.0.1:27017',
  MONGODB_DATABASE: 'commerce_test',
  REDIS_URL: 'redis://localhost:6379',
  APP_ORIGINS: 'http://localhost:3000',
  SESSION_SECRET: 'a'.repeat(48),
};

describe('Environment validation', () => {
  it('parses defaults and explicit origins', () => {
    expect(validateEnvironment(valid)).toMatchObject({ PORT: 4000, APP_ORIGINS: ['http://localhost:3000'] });
  });
  it.each([
    { MONGODB_URI: 'postgresql://localhost/test' },
    { MONGODB_DATABASE: 'invalid/name' },
    { MONGODB_DATABASE: 'a'.repeat(39) },
    { APP_ORIGINS: '*' },
    { APP_ORIGINS: 'http://localhost:3000/' },
    { SESSION_SECRET: 'replace-with-a-random-secret-at-least-32-characters' },
    { COOKIE_SAME_SITE: 'none' },
    { TRUST_PROXY: 'true' },
    { SESSION_ABSOLUTE_TTL_SECONDS: 60 },
    { NODE_ENV: 'production' },
  ])('rejects unsafe settings %o', (override) => {
    expect(() => validateEnvironment({ ...valid, ...override })).toThrow('Invalid configuration');
  });
  it('does not expose credentials in validation errors', () => {
    expect(() => validateEnvironment({ ...valid, MONGODB_URI: 'secret-password' })).toThrow(/^((?!secret-password).)*$/);
  });
  it('accepts replica-set connection strings with multiple hosts', () => {
    expect(validateEnvironment({ ...valid, MONGODB_URI: 'mongodb://host1:27017,host2:27017/?replicaSet=rs0' }).MONGODB_URI).toContain('host2');
  });
  it('accepts Atlas and production TLS while rejecting insecure overrides', () => {
    const production = { ...valid, NODE_ENV: 'production', MONGODB_URI: 'mongodb+srv://user:password@cluster.example.com', REDIS_URL: 'rediss://redis.example.com', APP_ORIGINS: 'https://shop.example.com', REDIS_PREFIX: 'commerce:production:' };
    expect(validateEnvironment(production).NODE_ENV).toBe('production');
    for (const options of ['tls=false', 'ssl=false', 'tlsInsecure=true', 'tlsAllowInvalidCertificates=true', 'tlsAllowInvalidHostnames=true']) {
      expect(() => validateEnvironment({ ...production, MONGODB_URI: `${production.MONGODB_URI}/?${options}` })).toThrow('Invalid configuration');
    }
    expect(validateEnvironment({ ...production, MONGODB_URI: 'mongodb://mongo.example.com/?tls=true' }).NODE_ENV).toBe('production');
  });
});
