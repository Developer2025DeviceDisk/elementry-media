import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { Decimal128, MongoClient } from 'mongodb';
import { Environment } from '../src/config/environment';
import { MongoDbService } from '../src/infrastructure/mongodb/mongodb.service';
import { setupMongoSchema } from '../src/infrastructure/mongodb/schema';
import { moneyToDecimal } from '../src/infrastructure/mongodb/money';
import { Role, OrderStatus, ProductDocument } from '../src/infrastructure/mongodb/models';
import { CacheService } from '../src/infrastructure/redis/cache.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { PasswordService } from '../src/modules/auth/password.service';
import { ProductsService } from '../src/modules/products/products.service';
import { SessionGuard } from '../src/common/security/session.guard';
import { importLegacyDocuments, mapLegacyExport } from '../src/infrastructure/mongodb/legacy-import';
import { configureApp } from '../src/bootstrap';

const transactionTest = process.env.TEST_MONGODB_TRANSACTIONS === 'true' || process.env.TEST_MONGODB_URI?.startsWith('mongodb+srv://') ? it : it.skip;

// Real MongoDB; Redis is deliberately unavailable to verify catalog fallback.
describe('MongoDB persistence integration (no Redis required)', () => {
  let mongo: MongoDbService;
  let auth: AuthService;
  let products: ProductsService;
  const database = `elementry_test_${randomUUID().replaceAll('-', '').slice(0, 16)}`;
  const email = `mongo-${randomUUID()}@example.com`;
  const httpEmail = `http-${email}`;
  const password = 'correct horse battery staple';
  const ids = Array.from({ length: 4 }, () => randomUUID());
  const sku = `mongo-${randomUUID()}`;
  const orderId = randomUUID();
  const itemIds = [randomUUID(), randomUUID()];
  let userId: string;

  beforeAll(async () => {
    if (!process.env.TEST_MONGODB_URI) throw new Error('Set TEST_MONGODB_URI to run real MongoDB tests');
    const config = new ConfigService({ MONGODB_URI: process.env.TEST_MONGODB_URI, MONGODB_DATABASE: database, CACHE_TTL_SECONDS: 60, SESSION_ABSOLUTE_TTL_SECONDS: 600 }) as ConfigService<Environment, true>;
    mongo = new MongoDbService(config);
    await mongo.client.connect();
    await setupMongoSchema(mongo.db);
    await mongo.onModuleInit();
    auth = new AuthService(mongo, new PasswordService());
    const redis = { key: (key: string) => key, client: { get: async () => { throw new Error('offline'); } } } as unknown as RedisService;
    products = new ProductsService(mongo, new CacheService(redis), config);
    const now = new Date();
    await mongo.products.insertMany(ids.map((_id, i) => ({ _id, sku: `${sku}-${i}`, name: `Camera ${i === 0 ? 'a.*(b)' : i}`, description: 'Mongo persistence fixture', price: moneyToDecimal(i === 0 ? '9999999999.99' : '19.90'), currency: 'INR', stock: 3, active: i < 3, createdAt: new Date(now.getTime() + i), updatedAt: now })));
  });
  afterAll(async () => {
    if (mongo) {
      try {
        await mongo.orderItems.deleteMany({ _id: { $in: itemIds } });
        await mongo.orders.deleteMany({ _id: orderId });
        await mongo.users.deleteMany({ email: { $in: [email, httpEmail] } });
        await mongo.products.deleteMany({ _id: { $in: ids } });
      } finally { await mongo.onModuleDestroy(); }
    }
  });

  it('registers customer-only UUID accounts and persists salted hashes', async () => {
    const registered = await auth.register({ email: email.toUpperCase(), password, name: 'Mongo User' });
    userId = registered.id;
    expect(registered).toMatchObject({ email, role: Role.CUSTOMER });
    expect(registered).not.toHaveProperty('passwordHash');
    const other = new MongoClient(process.env.TEST_MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });
    try {
      await other.connect();
      const persisted = await other.db(database).collection('users').findOne({ email });
      expect(persisted).toMatchObject({ _id: userId, role: Role.CUSTOMER });
      expect(persisted!.passwordHash).not.toBe(password);
      expect(await new PasswordService().verify(password, persisted!.passwordHash)).toBe(true);
    } finally { await other.close(); }
  });
  it('rejects duplicate normalized emails even under concurrent registration', async () => {
    const results = await Promise.allSettled([auth.register({ email, password, name: 'Duplicate' }), auth.register({ email: email.toUpperCase(), password, name: 'Duplicate' })]);
    for (const result of results) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') expect(result.reason.code).toBe(11000);
    }
    expect(await mongo.users.countDocuments({ email })).toBe(1);
  });
  it('authenticates persisted accounts and rejects wrong or missing credentials', async () => {
    expect(await auth.login({ email, password })).toMatchObject({ id: userId, role: Role.CUSTOMER });
    await expect(auth.login({ email, password: 'wrong-password' })).rejects.toThrow('Invalid email or password');
    await expect(auth.login({ email: 'missing@example.com', password })).rejects.toThrow('Invalid email or password');
  });
  it('loads changed roles and rejects disabled accounts and expired sessions', async () => {
    const request = { session: { userId, authenticatedAt: Date.now() }, user: undefined as unknown };
    const context = { getHandler: () => null, getClass: () => null, switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
    const reflector = { getAllAndOverride: () => undefined } as unknown as Reflector;
    const config = new ConfigService({ SESSION_ABSOLUTE_TTL_SECONDS: 600 }) as ConfigService<Environment, true>;
    const guard = new SessionGuard(reflector, mongo, config);
    await mongo.users.updateOne({ _id: userId }, { $set: { role: Role.ADMIN } });
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.user).toMatchObject({ id: userId, role: Role.ADMIN });
    await mongo.users.updateOne({ _id: userId }, { $set: { disabledAt: new Date() } });
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
    await expect(auth.login({ email, password })).rejects.toThrow('Invalid email or password');
    await mongo.users.updateOne({ _id: userId }, { $set: { disabledAt: null, role: Role.CUSTOMER } });
    request.session.authenticatedAt = Date.now() - 601000;
    await expect(guard.canActivate(context)).rejects.toThrow('Authentication required');
  });
  it('reads precise BSON money through catalog APIs despite Redis being unavailable', async () => {
    const detail = await products.detail(ids[0]);
    expect(detail).toMatchObject({ id: ids[0], price: '9999999999.99', currency: 'INR', description: 'Mongo persistence fixture' });
    expect(detail).not.toHaveProperty('_id');
    expect(new Date(detail.createdAt).toISOString()).toBe(detail.createdAt);
    expect((await products.list({ q: sku, page: 1, limit: 2 })).data.map(p => p.id)).toEqual([ids[2], ids[1]]);
    expect((await products.list({ q: sku, page: 2, limit: 2 })).data.map(p => p.id)).toEqual([ids[0]]);
    expect((await products.list({ q: 'a.*(b)', page: 1, limit: 10 })).data.map(p => p.id)).toEqual([ids[0]]);
    await expect(products.detail(ids[3])).rejects.toThrow('Product not found');
  });
  it('enforces product uniqueness, stock and exact monetary precision at database level', async () => {
    const product = (await mongo.products.findOne({ _id: ids[0] }))!;
    await expect(mongo.products.insertOne(product)).rejects.toMatchObject({ code: 11000 });
    await expect(mongo.products.updateOne({ _id: ids[3] }, { $set: { sku: product.sku } })).rejects.toMatchObject({ code: 11000 });
    for (const override of [{ stock: -1 }, { stock: 1.5 }, { price: Decimal128.fromString('-1') }, { price: Decimal128.fromString('1.001') }, { price: 19.9 }]) {
      await expect(mongo.products.updateOne({ _id: ids[0] }, { $set: override as Partial<ProductDocument> })).rejects.toMatchObject({ code: 121 });
    }
  });
  it('persists order snapshots and enforces idempotency, item uniqueness and quantities', async () => {
    const now = new Date();
    const order = { _id: orderId, userId, status: OrderStatus.PENDING, total: moneyToDecimal('19.90'), currency: 'INR', idempotencyKey: orderId, createdAt: now, updatedAt: now };
    await mongo.orders.insertOne(order);
    await expect(mongo.orders.insertOne({ ...order, _id: randomUUID() })).rejects.toMatchObject({ code: 11000 });
    const item = { _id: itemIds[0], orderId, productId: ids[1], quantity: 1, unitPrice: moneyToDecimal('19.90'), sku: `${sku}-1`, name: 'Historic camera snapshot' };
    await mongo.orderItems.insertOne(item);
    await expect(mongo.orderItems.insertOne({ ...item, _id: itemIds[1] })).rejects.toMatchObject({ code: 11000 });
    await expect(mongo.orderItems.updateOne({ _id: item._id }, { $set: { quantity: 0 } })).rejects.toMatchObject({ code: 121 });
    expect((await mongo.orderItems.findOne({ _id: item._id }))!.unitPrice.toString()).toBe('19.90');
  });
  it('maps legacy records without changing IDs, hashes, money or snapshots', async () => {
    const user = (await mongo.users.findOne({ _id: userId }))!;
    const product = (await mongo.products.findOne({ _id: ids[1] }))!;
    const order = (await mongo.orders.findOne({ _id: orderId }))!;
    const item = (await mongo.orderItems.findOne({ _id: itemIds[0] }))!;
    const exportRecord = (doc: { _id: string }) => { const { _id, ...fields } = doc; return { id: _id, ...fields }; };
    const exported = JSON.parse(JSON.stringify({ users: [exportRecord(user)], products: [{ ...exportRecord(product), price: product.price.toString() }], orders: [{ ...exportRecord(order), total: order.total.toString() }], orderItems: [{ ...exportRecord(item), unitPrice: item.unitPrice.toString() }] }));
    const mapped = mapLegacyExport(exported);
    expect(mapped.users[0]).toEqual(user);
    expect(mapped.products[0]).toEqual(product);
    expect(mapped.orders[0]).toEqual(order);
    expect(mapped.orderItems[0]).toEqual(item);
    expect(() => mapLegacyExport({ ...exported, users: [] })).toThrow('missing');
    expect(() => mapLegacyExport({ ...exported, users: [...exported.users, ...exported.users] })).toThrow('duplicate');
  });
  it('reapplies schema safely and confirms required startup indexes', async () => {
    await setupMongoSchema(mongo.db);
    await mongo.onModuleInit();
    await mongo.ping();
  });
  transactionTest('imports atomically into an empty replica-set database and rolls back invalid writes', async () => {
    const destination = mongo.client.db(`elementry_test_import_${randomUUID().slice(0, 8)}`);
    await setupMongoSchema(destination);
    const documents = {
      users: [(await mongo.users.findOne({ _id: userId }))!],
      products: [(await mongo.products.findOne({ _id: ids[1] }))!],
      orders: [(await mongo.orders.findOne({ _id: orderId }))!],
      orderItems: [(await mongo.orderItems.findOne({ _id: itemIds[0] }))!],
    };
    const cleanup = async () => {
      for (const [name, records] of Object.entries(documents)) await destination.collection<{ _id: string }>(name).deleteMany({ _id: { $in: records.map(record => record._id) } });
    };
    try {
      await importLegacyDocuments(mongo.client, destination, documents);
      expect(await destination.collection('users').countDocuments()).toBe(1);
      expect((await destination.collection<ProductDocument>('products').findOne({ _id: ids[1] }))!.price.toString()).toBe('19.90');
      await expect(importLegacyDocuments(mongo.client, destination, documents)).rejects.toThrow('must be empty');
      await cleanup();
      await expect(importLegacyDocuments(mongo.client, destination, { ...documents, products: [{ ...documents.products[0], price: Decimal128.fromString('-1') }] })).rejects.toMatchObject({ code: 121 });
      for (const name of Object.keys(documents)) expect(await destination.collection(name).countDocuments()).toBe(0);
    } finally { await cleanup(); }
  });
  it('fails closed at startup when database setup is missing', async () => {
    const uninitialized = new MongoDbService(new ConfigService({ MONGODB_URI: process.env.TEST_MONGODB_URI, MONGODB_DATABASE: `elementry_test_${randomUUID().slice(0, 8)}` }) as ConfigService<Environment, true>);
    await expect(uninitialized.onModuleInit()).rejects.toThrow('MongoDB startup failed');
    await uninitialized.onModuleDestroy();
  });
  it('serves the HTTP auth/catalog contract against Atlas (Redis service double)', async () => {
    Object.assign(process.env, {
      NODE_ENV: 'test', MONGODB_URI: process.env.TEST_MONGODB_URI, MONGODB_DATABASE: database,
      REDIS_URL: 'redis://127.0.0.1:6379', REDIS_PREFIX: 'test:', APP_ORIGINS: 'http://localhost:3000',
      SESSION_SECRET: 'test-only-secret-with-at-least-32-characters', LOG_LEVEL: 'silent', COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '',
    });
    const sessions = new Map<string, string>();
    const redis = { key: (key: string) => `test:${key}`, client: {
      get: async (key: string) => sessions.get(key) ?? null,
      set: async (key: string, value: string) => { sessions.set(key, value); return 'OK'; },
      del: async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) sessions.delete(key); return 1; },
      expire: async () => true, eval: async () => [1, 60], ping: async () => 'PONG',
    } };
    const { AppModule } = await import('../src/app.module');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MongoDbService).useValue({ users: mongo.users, products: mongo.products, ping: () => mongo.ping() })
      .overrideProvider(RedisService).useValue(redis).compile();
    const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false, logger: false });
    try {
      configureApp(app);
      await app.init();
      const agent = request.agent(app.getHttpServer());
      await agent.get('/api/v1/auth/me').expect(401);
      await agent.post('/api/v1/auth/register').send({}).expect(403);
      const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
      const dto = { email: httpEmail, password, name: 'HTTP Atlas User' };
      await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ ...dto, role: 'ADMIN' }).expect(400);
      const registered = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send(dto).expect(201);
      expect(registered.body.user).toMatchObject({ email: httpEmail, role: 'CUSTOMER' });
      expect(registered.body.user).not.toHaveProperty('passwordHash');
      expect(registered.headers['set-cookie']).not.toEqual(csrf.headers['set-cookie']);
      await agent.get('/api/v1/auth/me').expect(200);
      const duplicate = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', registered.body.csrfToken).send(dto).expect(409);
      expect(duplicate.body.message).toBe('Resource already exists');
      expect(JSON.stringify(duplicate.body)).not.toContain(httpEmail);
      const cookie = registered.headers['set-cookie'];
      await agent.post('/api/v1/auth/logout').set('X-CSRF-Token', registered.body.csrfToken).expect(204);
      await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', cookie).expect(401);
      const next = await agent.get('/api/v1/auth/csrf').expect(200);
      await agent.post('/api/v1/auth/login').set('X-CSRF-Token', next.body.csrfToken).send({ email: httpEmail, password }).expect(200);
      const detail = await agent.get(`/api/v1/products/${ids[0]}`).expect(200);
      expect(detail.body).toMatchObject({ id: ids[0], price: '9999999999.99' });
      await agent.get(`/api/v1/products/${ids[3]}`).expect(404);
      await agent.get('/api/v1/health/ready').expect(200);
    } finally { await app.close(); }
  });
});
