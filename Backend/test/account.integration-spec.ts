import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { MongoClient } from 'mongodb';
import { MongoDbService } from '../src/infrastructure/mongodb/mongodb.service';
import { RedisService } from '../src/infrastructure/redis/redis.service';
import { setupMongoSchema } from '../src/infrastructure/mongodb/schema';
import { moneyToDecimal } from '../src/infrastructure/mongodb/money';
import { OrderStatus, Role } from '../src/infrastructure/mongodb/models';
import { configureApp } from '../src/bootstrap';

describe('Customer account integration (real MongoDB and Redis)', () => {
  let app: NestExpressApplication; let mongo: MongoDbService; let redis: RedisService;
  let alice: ReturnType<typeof request.agent>; let bob: ReturnType<typeof request.agent>; let admin: ReturnType<typeof request.agent>;
  let aliceId: string; let bobId: string; let aliceCsrf: string; let bobCsrf: string; let adminCsrf: string;
  const suffix = randomUUID(); const prefix = `commerce:test:account:${suffix}:`;
  const emails = ['alice', 'bob', 'admin'].map(name => `${name}-${suffix}@example.com`);
  const password = 'account integration password'; const newPassword = 'changed account integration password';
  const productId = randomUUID(); const aliceOrder = randomUUID(); const pendingOrder = randomUUID(); const bobOrder = randomUUID();
  const itemIds = [randomUUID(), randomUUID()]; let addressId: string; let upiId: string; let returnId: string;
  const address = { label: 'Home', name: 'Alice', phone: '+919999999999', line1: '123 Real Test Road', line2: '', city: 'Delhi', state: 'Delhi', postalCode: '110001', country: 'IN' };
  beforeAll(async () => {
    if (!process.env.TEST_MONGODB_URI || !process.env.TEST_REDIS_URL) throw new Error('Set TEST_MONGODB_URI and TEST_REDIS_URL');
    Object.assign(process.env, { NODE_ENV: 'test', MONGODB_URI: process.env.TEST_MONGODB_URI, MONGODB_DATABASE: `account_test_${suffix.replaceAll('-', '').slice(0, 16)}`,
      REDIS_URL: process.env.TEST_REDIS_URL, REDIS_PREFIX: prefix, SESSION_SECRET: 'account-integration-secret-with-at-least-32-characters', APP_ORIGINS: 'http://localhost:3001', AUTH_RATE_LIMIT_MAX: '100', RATE_LIMIT_MAX: '1000', LOG_LEVEL: 'silent', COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '' });
    const setup = new MongoClient(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });
    try { await setup.connect(); await setupMongoSchema(setup.db(process.env.MONGODB_DATABASE)); } finally { await setup.close(); }
    const { AppModule } = await import('../src/app.module');
    app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: false }); configureApp(app); await app.init();
    mongo = app.get(MongoDbService); redis = app.get(RedisService);
    const register = async (email: string, name: string) => {
      const agent = request.agent(app.getHttpServer()); const csrf = await agent.get('/api/v1/auth/csrf').expect(200);
      const result = await agent.post('/api/v1/auth/register').set('X-CSRF-Token', csrf.body.csrfToken).send({ email, name, password }).expect(201);
      return { agent, id: result.body.user.id as string, csrf: result.body.csrfToken as string };
    };
    const a = await register(emails[0], 'Alice'); alice = a.agent; aliceId = a.id; aliceCsrf = a.csrf;
    const b = await register(emails[1], 'Bob'); bob = b.agent; bobId = b.id; bobCsrf = b.csrf;
    const c = await register(emails[2], 'Operations'); admin = c.agent; adminCsrf = c.csrf;
    await mongo.users.updateOne({ _id: c.id }, { $set: { role: Role.ADMIN } });
    const now = new Date();
    await mongo.products.insertOne({ _id: productId, sku: `ACCOUNT-${suffix}`, name: 'Current product name', description: null, price: moneyToDecimal('99.99'), currency: 'INR', stock: 10, active: true, createdAt: now, updatedAt: now });
    await mongo.orders.insertMany([{ _id: aliceOrder, userId: aliceId, status: OrderStatus.FULFILLED }, { _id: pendingOrder, userId: aliceId, status: OrderStatus.PENDING }, { _id: bobOrder, userId: bobId, status: OrderStatus.PAID }].map(order => ({ ...order, total: moneyToDecimal('19.90'), currency: 'INR', idempotencyKey: order._id, createdAt: now, updatedAt: now })));
    await mongo.orderItems.insertMany([{ _id: itemIds[0], orderId: aliceOrder }, { _id: itemIds[1], orderId: bobOrder }].map(item => ({ ...item, productId, quantity: 1, unitPrice: moneyToDecimal('19.90'), sku: 'ORIGINAL-SKU', name: 'Original purchase name' })));
  }, 60000);
  afterAll(async () => {
    try {
      if (mongo) {
        await mongo.returns.deleteMany({ orderId: { $in: [aliceOrder, pendingOrder, bobOrder] } });
        await mongo.tracking.deleteMany({ _id: { $in: [aliceOrder, pendingOrder, bobOrder] } });
        await mongo.orderItems.deleteMany({ _id: { $in: itemIds } }); await mongo.orders.deleteMany({ _id: { $in: [aliceOrder, pendingOrder, bobOrder] } });
        await mongo.products.deleteOne({ _id: productId });
        const users = await mongo.users.find({ email: { $in: emails } }).toArray();
        await mongo.accounts.deleteMany({ _id: { $in: users.map(user => user._id) } }); await mongo.users.deleteMany({ email: { $in: emails } });
      }
      if (redis?.client.isReady) for await (const key of redis.client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) await redis.client.del(key);
    } finally { if (app) await app.close(); }
  });
  it('requires authentication/CSRF and returns only the current customer dashboard', async () => {
    await request(app.getHttpServer()).get('/api/v1/account').expect(401);
    await alice.patch('/api/v1/account/profile').send({ name: 'Blocked', phone: '' }).expect(403);
    const dashboard = await alice.get('/api/v1/account').expect(200);
    expect(dashboard.body.profile).toMatchObject({ id: aliceId, email: emails[0] }); expect(dashboard.body.counts.orders).toBe(2);
    expect(dashboard.body.recentOrders.map((order: { id: string }) => order.id)).not.toContain(bobOrder);
    expect(JSON.stringify(dashboard.body)).not.toContain('passwordHash');
    await alice.patch('/api/v1/account/profile').set('X-CSRF-Token', aliceCsrf).send({ name: 'Alice', phone: '', role: 'ADMIN' }).expect(400);
    await alice.get('/api/v1/account/orders?userId=anything').expect(400);
  });
  it('persists profile changes and keeps sign-in email and roles protected', async () => {
    const updated = await alice.patch('/api/v1/account/profile').set('X-CSRF-Token', aliceCsrf).send({ name: 'Alice Updated', phone: '+919876543210' }).expect(200);
    expect(updated.body).toMatchObject({ name: 'Alice Updated', email: emails[0], phone: '+919876543210' });
    expect((await alice.get('/api/v1/auth/me').expect(200)).body.user.name).toBe('Alice Updated');
    expect((await bob.get('/api/v1/account/profile').expect(200)).body.phone).toBeNull();
  });
  it('creates, edits, defaults and deletes saved addresses with ownership enforced', async () => {
    const saved = await alice.post('/api/v1/account/addresses').set('X-CSRF-Token', aliceCsrf).send(address).expect(201); addressId = saved.body.data[0].id;
    expect(saved.body.defaultId).toBe(addressId);
    await bob.patch(`/api/v1/account/addresses/${addressId}`).set('X-CSRF-Token', bobCsrf).send(address).expect(404);
    await bob.delete(`/api/v1/account/addresses/${addressId}`).set('X-CSRF-Token', bobCsrf).expect(404);
    expect((await bob.get('/api/v1/account/addresses').expect(200)).body.data).toEqual([]);
    await alice.patch(`/api/v1/account/addresses/${addressId}`).set('X-CSRF-Token', aliceCsrf).send({ ...address, label: 'Updated home' }).expect(200);
    const office = await alice.post('/api/v1/account/addresses').set('X-CSRF-Token', aliceCsrf).send({ ...address, label: 'Office' }).expect(201);
    const officeId = office.body.data.find((record: { label: string }) => record.label === 'Office').id;
    const preferred = await alice.post(`/api/v1/account/addresses/${officeId}/default`).set('X-CSRF-Token', aliceCsrf).expect(201); expect(preferred.body.defaultId).toBe(officeId);
    const deleted = await alice.delete(`/api/v1/account/addresses/${officeId}`).set('X-CSRF-Token', aliceCsrf).expect(200); expect(deleted.body.defaultId).toBe(addressId);
  });
  it('persists UPI methods, rejects duplicates/card fields and protects other accounts', async () => {
    const saved = await alice.post('/api/v1/account/payment-methods').set('X-CSRF-Token', aliceCsrf).send({ label: 'Personal', upiId: 'alice@bank' }).expect(201); upiId = saved.body.data[0].id;
    await alice.post('/api/v1/account/payment-methods').set('X-CSRF-Token', aliceCsrf).send({ label: 'Duplicate', upiId: 'ALICE@BANK' }).expect(409);
    await alice.post('/api/v1/account/payment-methods').set('X-CSRF-Token', aliceCsrf).send({ label: 'Card', upiId: 'alice@bank', cardNumber: '4242424242424242' }).expect(400);
    await bob.patch(`/api/v1/account/payment-methods/${upiId}`).set('X-CSRF-Token', bobCsrf).send({ label: 'Hijack', upiId: 'bob@bank' }).expect(404);
    await alice.patch(`/api/v1/account/payment-methods/${upiId}`).set('X-CSRF-Token', aliceCsrf).send({ label: 'Updated personal', upiId: 'alice.updated@bank' }).expect(200);
    const second = await alice.post('/api/v1/account/payment-methods').set('X-CSRF-Token', aliceCsrf).send({ label: 'Work', upiId: 'alice.work@bank' }).expect(201);
    const secondId = second.body.data.find((record: { label: string }) => record.label === 'Work').id;
    expect((await alice.post(`/api/v1/account/payment-methods/${secondId}/default`).set('X-CSRF-Token', aliceCsrf).expect(201)).body.defaultId).toBe(secondId);
    expect((await alice.delete(`/api/v1/account/payment-methods/${secondId}`).set('X-CSRF-Token', aliceCsrf).expect(200)).body.defaultId).toBe(upiId);
    expect((await bob.get('/api/v1/account/payment-methods').expect(200)).body.data).toEqual([]);
  });
  it('keeps wishlist mutations idempotent and private across customers', async () => {
    await alice.post('/api/v1/wishlist/items').set('X-CSRF-Token', aliceCsrf).send({ productId }).expect(204);
    await alice.post('/api/v1/wishlist/items').set('X-CSRF-Token', aliceCsrf).send({ productId }).expect(204);
    expect((await alice.get('/api/v1/wishlist').expect(200)).body.map((product: { id: string }) => product.id)).toEqual([productId]);
    expect((await bob.get('/api/v1/wishlist').expect(200)).body).toEqual([]);
    await bob.delete(`/api/v1/wishlist/items/${productId}`).set('X-CSRF-Token', bobCsrf).expect(204);
    expect((await alice.get('/api/v1/account').expect(200)).body.counts.wishlist).toBe(1);
    await alice.delete(`/api/v1/wishlist/items/${productId}`).set('X-CSRF-Token', aliceCsrf).expect(204);
    expect((await alice.get('/api/v1/wishlist').expect(200)).body).toEqual([]);
  });
  it('returns original purchase snapshots and hides foreign order IDs', async () => {
    const order = await alice.get(`/api/v1/account/orders/${aliceOrder}`).expect(200);
    expect(order.body.items[0]).toMatchObject({ name: 'Original purchase name', sku: 'ORIGINAL-SKU', unitPrice: '19.90' }); expect(order.body.total).toBe('19.90');
    await bob.get(`/api/v1/account/orders/${aliceOrder}`).expect(404); await alice.get(`/api/v1/account/orders/${bobOrder}`).expect(404);
    await bob.post(`/api/v1/account/orders/${aliceOrder}/cancel`).set('X-CSRF-Token', bobCsrf).expect(404);
    const cancelled = await alice.post(`/api/v1/account/orders/${pendingOrder}/cancel`).set('X-CSRF-Token', aliceCsrf).expect(200); expect(cancelled.body.status).toBe('CANCELLED');
    await alice.post(`/api/v1/account/orders/${aliceOrder}/cancel`).set('X-CSRF-Token', aliceCsrf).expect(409);
  });
  it('allows only administrators to record valid shipping events', async () => {
    const shipped = { status: 'SHIPPED', carrier: 'Test carrier', trackingNumber: 'TRACK-TEST', note: 'Dispatched in test' };
    await alice.post(`/api/v1/admin/account/orders/${bobOrder}/tracking`).set('X-CSRF-Token', aliceCsrf).send(shipped).expect(403);
    await admin.post(`/api/v1/admin/account/orders/${pendingOrder}/tracking`).set('X-CSRF-Token', adminCsrf).send(shipped).expect(409);
    await admin.post(`/api/v1/admin/account/orders/${bobOrder}/tracking`).set('X-CSRF-Token', adminCsrf).send(shipped).expect(204);
    const tracking = await bob.get(`/api/v1/account/orders/${bobOrder}`).expect(200); expect(tracking.body.tracking.events[0].status).toBe('SHIPPED');
    await admin.post(`/api/v1/admin/account/orders/${bobOrder}/tracking`).set('X-CSRF-Token', adminCsrf).send({ ...shipped, status: 'PACKED' }).expect(409);
    await alice.get(`/api/v1/account/orders/${bobOrder}`).expect(404);
  });
  it('creates one owned return and records reviewed refunds only with an external reference', async () => {
    await bob.post(`/api/v1/account/orders/${aliceOrder}/returns`).set('X-CSRF-Token', bobCsrf).send({ reason: 'Please return this purchase' }).expect(404);
    const returned = await alice.post(`/api/v1/account/orders/${aliceOrder}/returns`).set('X-CSRF-Token', aliceCsrf).send({ reason: 'Item arrived with a problem' }).expect(201); returnId = returned.body.id;
    await alice.post(`/api/v1/account/orders/${aliceOrder}/returns`).set('X-CSRF-Token', aliceCsrf).send({ reason: 'Duplicate request rejected' }).expect(409);
    expect((await bob.get('/api/v1/account/returns').expect(200)).body.total).toBe(0);
    await alice.patch(`/api/v1/admin/account/returns/${returnId}`).set('X-CSRF-Token', aliceCsrf).send({ status: 'APPROVED', note: 'Cannot approve own request' }).expect(403);
    await admin.patch(`/api/v1/admin/account/returns/${returnId}`).set('X-CSRF-Token', adminCsrf).send({ status: 'REFUNDED', note: 'Cannot skip review', refundReference: 'TEST-REFUND' }).expect(409);
    for (const status of ['APPROVED', 'RECEIVED', 'REFUND_PENDING']) await admin.patch(`/api/v1/admin/account/returns/${returnId}`).set('X-CSRF-Token', adminCsrf).send({ status, note: `Test workflow ${status}` }).expect(200);
    await admin.patch(`/api/v1/admin/account/returns/${returnId}`).set('X-CSRF-Token', adminCsrf).send({ status: 'REFUNDED', note: 'No reconciliation reference' }).expect(400);
    const refunded = await admin.patch(`/api/v1/admin/account/returns/${returnId}`).set('X-CSRF-Token', adminCsrf).send({ status: 'REFUNDED', note: 'Synthetic refund reconciliation', refundReference: 'TEST-REFUND-NO-MONEY-MOVED' }).expect(200);
    expect(refunded.body).toMatchObject({ refundAmount: '19.90', currency: 'INR', refundReference: 'TEST-REFUND-NO-MONEY-MOVED' });
    expect((await alice.get('/api/v1/account/returns').expect(200)).body.data[0].status).toBe('REFUNDED');
  });
  it('stores preferences without changing another customer settings', async () => {
    await alice.patch('/api/v1/account/settings').set('X-CSRF-Token', aliceCsrf).send({ orderUpdates: false, marketingEmails: true }).expect(200);
    expect((await alice.get('/api/v1/account/settings').expect(200)).body).toEqual({ orderUpdates: false, marketingEmails: true });
    expect((await bob.get('/api/v1/account/settings').expect(200)).body).toEqual({ orderUpdates: true, marketingEmails: false });
  });
  it('changes passwords and immediately revokes every existing session', async () => {
    const other = request.agent(app.getHttpServer()); const csrf = await other.get('/api/v1/auth/csrf').expect(200);
    await other.post('/api/v1/auth/login').set('X-CSRF-Token', csrf.body.csrfToken).send({ email: emails[0], password }).expect(200);
    await alice.post('/api/v1/account/password').set('X-CSRF-Token', aliceCsrf).send({ currentPassword: 'incorrect current password', newPassword }).expect(400);
    await alice.get('/api/v1/account/profile').expect(200);
    await alice.post('/api/v1/account/password').set('X-CSRF-Token', aliceCsrf).send({ currentPassword: password, newPassword }).expect(204);
    await alice.get('/api/v1/account').expect(401); await other.get('/api/v1/account').expect(401);
    const next = await alice.get('/api/v1/auth/csrf').expect(200);
    await alice.post('/api/v1/auth/login').set('X-CSRF-Token', next.body.csrfToken).send({ email: emails[0], password }).expect(401);
    const signedIn = await alice.post('/api/v1/auth/login').set('X-CSRF-Token', next.body.csrfToken).send({ email: emails[0], password: newPassword }).expect(200);
    await alice.post('/api/v1/account/sessions/revoke').set('X-CSRF-Token', signedIn.body.csrfToken).send({ currentPassword: newPassword }).expect(204);
    await alice.get('/api/v1/account').expect(401); await bob.get('/api/v1/account').expect(200);
  });
});
