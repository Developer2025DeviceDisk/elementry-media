import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { Decimal128, MongoClient } from 'mongodb';
import { MongoDbService } from '../src/infrastructure/mongodb/mongodb.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { configureApp } from '../src/bootstrap';
import { setupMongoSchema } from '../src/infrastructure/mongodb/schema';
import { moneyToDecimal } from '../src/infrastructure/mongodb/money';
import { ProductDocument } from '../src/infrastructure/mongodb/models';

// Real MongoDB and Redis required. Never use the application database here.
describe('API integration', () => {
  let app: NestExpressApplication;
  let mongo: MongoDbService;
  let redis: RedisService;
  const email = `integration-${randomUUID()}@example.com`;
  const prefix = `commerce:test:${randomUUID()}:`;
  const productIds = Array.from({ length: 4 }, () => randomUUID());
  const tag = `integration-${randomUUID()}`;
  let registeredId: string;

  beforeAll(async () => {
    if (!process.env.TEST_MONGODB_URI || !process.env.TEST_REDIS_URL) throw new Error('Set TEST_MONGODB_URI and TEST_REDIS_URL to dedicated test services');
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = process.env.TEST_MONGODB_URI;
    process.env.MONGODB_DATABASE = process.env.TEST_MONGODB_DATABASE ?? `elementry_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
    if (!/(^|_)test($|_)/.test(process.env.MONGODB_DATABASE)) throw new Error('Integration database name must contain a test segment');
    const setup = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    try { await setup.connect(); await setupMongoSchema(setup.db(process.env.MONGODB_DATABASE)); }
    finally { await setup.close(); }
    process.env.REDIS_URL = process.env.TEST_REDIS_URL;
    process.env.REDIS_PREFIX = prefix;
    process.env.SESSION_SECRET = 'integration-only-secret-with-at-least-32-characters';
    process.env.APP_ORIGINS = 'http://localhost:3000';
    process.env.AUTH_RATE_LIMIT_MAX = '20';
    process.env.RATE_LIMIT_MAX = '200';
    process.env.LOG_LEVEL = 'silent';
    process.env.TRUST_PROXY = '';
    process.env.COOKIE_SAME_SITE = 'lax';
    const { AppModule } = await import('../src/app.module');
    app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false });
    configureApp(app);
    await app.init();
    mongo = app.get(MongoDbService);
    redis = app.get(RedisService);
    const now = new Date();
    await mongo.products.insertMany(productIds.map((_id, i) => ({
      _id, sku: `${tag}-${i}`, name: `${tag} Camera ${i === 0 ? 'a.*(b)' : i}`, description: 'catalog persistence test',
      price: moneyToDecimal(i === 0 ? '9999999999.99' : '19.90'), currency: 'INR', stock: 3,
      active: i < 3, createdAt: new Date(now.getTime() + i), updatedAt: now,
    })));
  });

  afterAll(async () => {
    try {
      if (mongo) {
        await mongo.users.deleteMany({ email });
        await mongo.products.deleteMany({ _id: { $in: productIds } });
      }
      if (redis?.client.isReady) {
        for await (const key of redis.client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) await redis.client.del(key);
      }
    } finally { if (app) await app.close(); }
  });

  it('protects writes, rotates sessions, rejects role injection, and revokes logout', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get('/api/v1/auth/me').expect(401);
    await agent.post('/api/v1/auth/register').send({}).expect(403);
    const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
    const oldCookie = csrf.headers['set-cookie'];
    const dto = { email, name: 'Integration User', password: 'correct horse battery staple' };
    await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ ...dto, role: 'ADMIN' }).expect(400);
    const registered = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send(dto).expect(201);
    expect(registered.body.user.role).toBe('CUSTOMER');
    registeredId = registered.body.user.id;
    expect(registered.body.user.passwordHash).toBeUndefined();
    expect(registered.headers['set-cookie']).not.toEqual(oldCookie);
    await agent.get('/api/v1/auth/me').expect(200);
    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', csrf.body.csrfToken).expect(403);
    const authenticatedCookie = registered.headers['set-cookie'];
    await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', registered.body.csrfToken).expect(204);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', authenticatedCookie).expect(401);
    const nextCsrf = await agent.get('/api/v1/auth/csrf').expect(200);
    await agent.post('/api/v1/auth/login').set('X-CSRF-Token', nextCsrf.body.csrfToken).send({ email, password: dto.password }).expect(200);
  });

  it('persists password hashes and UUIDs and translates duplicate emails to 409', async () => {
    const independent = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });
    try {
      await independent.connect();
      const user = await independent.db(process.env.MONGODB_DATABASE).collection('users').findOne({ email });
      expect(user).toMatchObject({ _id: registeredId, email, role: 'CUSTOMER' });
      expect(user!.passwordHash).not.toBe('correct horse battery staple');
    } finally { await independent.close(); }
    const agent = request.agent(app.getHttpServer());
    const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
    const duplicate = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken)
      .send({ email: email.toUpperCase(), name: 'Duplicate', password: 'correct horse battery staple' }).expect(409);
    expect(duplicate.body.message).toBe('Resource already exists');
    expect(JSON.stringify(duplicate.body)).not.toContain(email);
    expect(await mongo.users.countDocuments({ email })).toBe(1);
  });

  it('returns persisted products with exact decimal prices, literal search and stable pagination', async () => {
    const page = await request(app.getHttpServer()).get('/api/v1/products').query({ q: tag, page: 1, limit: 2 }).expect(200);
    expect(page.body.data.map((p: { id: string }) => p.id)).toEqual([productIds[2], productIds[1]]);
    const second = await request(app.getHttpServer()).get('/api/v1/products').query({ q: tag, page: 2, limit: 2 }).expect(200);
    expect(second.body.data.map((p: { id: string }) => p.id)).toEqual([productIds[0]]);
    expect(second.body.data[0].price).toBe('9999999999.99');
    expect(second.body.data[0]._id).toBeUndefined();
    const literal = await request(app.getHttpServer()).get('/api/v1/products').query({ q: 'a.*(b)' }).expect(200);
    expect(literal.body.data.map((p: { id: string }) => p.id)).toEqual([productIds[0]]);
    const detail = await request(app.getHttpServer()).get(`/api/v1/products/${productIds[0]}`).expect(200);
    expect(detail.body.price).toBe('9999999999.99');
    await request(app.getHttpServer()).get(`/api/v1/products/${productIds[3]}`).expect(404);
    await request(app.getHttpServer()).get(`/api/v1/products/${randomUUID()}`).expect(404);
    await request(app.getHttpServer()).get('/api/v1/products/not-a-uuid').expect(400);
  });

  it('enforces MongoDB uniqueness and monetary/stock validation on direct writes', async () => {
    const product = (await mongo.products.findOne({ _id: productIds[0] }))!;
    await expect(mongo.products.insertOne(product)).rejects.toMatchObject({ code: 11000 });
    const invalid = { ...product, _id: productIds[3], sku: `${tag}-invalid` };
    for (const override of [{ stock: -1 }, { stock: 1.5 }, { price: Decimal128.fromString('-1') }, { price: Decimal128.fromString('1.001') }, { price: 19.9 }]) {
      // Change an existing document to ensure invalid data cannot be committed.
      await expect(mongo.products.replaceOne({ _id: productIds[3] }, { ...invalid, ...override } as ProductDocument)).rejects.toMatchObject({ code: 121 });
    }
  });

  it('loads current roles and revokes disabled accounts immediately', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
    await agent.post('/api/v1/auth/login').set('X-CSRF-Token', csrf.body.csrfToken)
      .send({ email, password: 'correct horse battery staple' }).expect(200);
    await mongo.users.updateOne({ email }, { $set: { role: 'ADMIN' as import('../src/infrastructure/mongodb/models').Role } });
    expect((await agent.get('/api/v1/auth/me').expect(200)).body.user.role).toBe('ADMIN');
    await mongo.users.updateOne({ email }, { $set: { disabledAt: new Date() } });
    await agent.get('/api/v1/auth/me').expect(401);
    const token = await agent.get('/api/v1/auth/csrf').expect(200);
    await agent.post('/api/v1/auth/login').set('X-CSRF-Token', token.body.csrfToken)
      .send({ email, password: 'correct horse battery staple' }).expect(401);
    await mongo.users.updateOne({ email }, { $set: { disabledAt: null } });
  });

  it('reports health and validates pagination', async () => {
    await request(app.getHttpServer()).get('/api/v1/health/live').expect(200);
    await request(app.getHttpServer()).get('/api/v1/health/ready').expect(200);
    await request(app.getHttpServer()).get('/api/v1/products?limit=10000').expect(400);
    await request(app.getHttpServer()).get('/api/v1/products?limit=10').expect(200);
  });

  it('atomically counts concurrent Redis requests', async () => {
    const { RATE_SCRIPT } = await import('../src/common/security/rate-limit.middleware');
    const key = `${prefix}atomic-test`;
    const results = await Promise.all(Array.from({ length: 20 }, () => redis.client.eval(RATE_SCRIPT, { keys: [key], arguments: ['60'] }) as Promise<number[]>));
    expect(results.map(([hits]) => hits).sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(await redis.client.ttl(key)).toBeGreaterThan(0);
  });
});
