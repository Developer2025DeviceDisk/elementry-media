import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { MongoDbService } from './infrastructure/mongodb/mongodb.service';
import { RedisService } from './infrastructure/redis/redis.service';
import { configureApp } from './bootstrap';

// Tests HTTP wiring using explicit service doubles. The separate integration
// suite verifies the same session flow against real MongoDB and Redis.
describe('HTTP security wiring (service doubles)', () => {
  let app: NestExpressApplication;
  const stored = new Map<string, string>();
  const users = new Map<string, Record<string, unknown>>();
  const evaluate = jest.fn(async () => [1, 60]);
  const mongo = {
    users: {
      insertOne: jest.fn(async (user: Record<string, unknown>) => {
        users.set(String(user.email), user);
        return { insertedId: user._id };
      }),
      findOne: jest.fn(async (filter: { email?: string; _id?: string }) => filter.email ? users.get(filter.email) : [...users.values()].find(u => u._id === filter._id)),
    },
    products: { find: jest.fn(() => ({ sort: () => ({ skip: () => ({ limit: () => ({ toArray: async () => [] }) }) }) })) },
    ping: jest.fn(async () => undefined),
  };
  const redis = {
    key: (key: string) => `test:${key}`,
    client: {
      get: async (key: string) => stored.get(key) ?? null,
      set: async (key: string, value: string) => { stored.set(key, value); return 'OK'; },
      del: async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) stored.delete(key); return 1; },
      expire: async () => true,
      scanIterator: async function* () { yield* stored.keys(); },
      eval: evaluate,
      ping: async () => 'PONG',
    },
  };

  beforeAll(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test', MONGODB_URI: 'mongodb://127.0.0.1:27017', MONGODB_DATABASE: 'unused_test',
      REDIS_URL: 'redis://localhost:6379', REDIS_PREFIX: 'test:', APP_ORIGINS: 'http://localhost:3000',
      SESSION_SECRET: 'test-only-secret-with-at-least-32-characters', LOG_LEVEL: 'silent', COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '',
    });
    const { AppModule } = await import('./app.module');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MongoDbService).useValue(mongo)
      .overrideProvider(RedisService).useValue(redis)
      .compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
    configureApp(app);
    await app.init();
  });
  afterAll(async () => { if (app) await app.close(); });

  it('requires CSRF, rejects unknown fields, rotates cookies and revokes sessions', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get('/api/v1/auth/me').expect(401);
    await agent.post('/api/v1/auth/register').send({}).expect(403);
    const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
    const oldCookie = csrf.headers['set-cookie'];
    expect(oldCookie[0]).toContain('HttpOnly');
    const dto = { email: ' Person@Example.com ', name: 'Person', password: 'correct horse battery staple' };
    await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ ...dto, role: 'ADMIN' }).expect(400);
    const registered = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send(dto).expect(201);
    expect(registered.body.user).toMatchObject({ email: 'person@example.com', role: 'CUSTOMER' });
    expect(registered.body.user.passwordHash).toBeUndefined();
    expect(registered.headers['set-cookie']).not.toEqual(oldCookie);
    await agent.get('/api/v1/auth/me').expect(200);
    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrf.body.csrfToken).expect(403);
    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', registered.body.csrfToken).expect(204);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', registered.headers['set-cookie']).expect(401);
    const nextCsrf = await agent.get('/api/v1/auth/csrf').expect(200);
    await agent.post('/api/v1/auth/login').set('X-CSRF-Token', nextCsrf.body.csrfToken).send({ email: 'person@example.com', password: dto.password }).expect(200);
  });

  it('formats malformed body errors without leaking the body', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"password":secret').expect(400);
    expect(response.body.message).toBe('Invalid JSON body');
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
    expect(JSON.stringify(response.body)).not.toContain('secret');
  });

  it('validates pagination and exposes a cached catalog', async () => {
    await request(app.getHttpServer()).get('/api/v1/products?limit=9999').expect(400);
    await request(app.getHttpServer()).get('/api/v1/products?limit=5').expect(200);
    await request(app.getHttpServer()).get('/api/v1/products?limit=5').expect(200);
    expect(mongo.products.find).toHaveBeenCalledTimes(1);
  });

  it('rejects oversized bodies', async () => {
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ password: 'x'.repeat(33000) }).expect(413);
    expect(response.body.message).toBe('Request body too large');
  });

  it('returns 429 for exhausted limits and 503 on Redis failure while liveness stays available', async () => {
    evaluate.mockResolvedValueOnce([9999, 50]);
    const limited = await request(app.getHttpServer()).get('/api/v1/products').expect(429);
    expect(limited.headers['retry-after']).toBe('50');
    evaluate.mockRejectedValueOnce(new Error('sensitive backend details'));
    const unavailable = await request(app.getHttpServer()).get('/api/v1/products').expect(503);
    expect(unavailable.body.message).toBe('Request protection unavailable');
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
  });
});
