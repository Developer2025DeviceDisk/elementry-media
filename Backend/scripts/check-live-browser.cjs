// Real frontend/backend smoke checks with isolated MongoDB records and Redis keys.
// Run with Node 22.14+ after building both apps:
// node --env-file=.env scripts/check-live-browser.cjs
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { createRequire } = require('node:module');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { MongoClient, Decimal128 } = require('mongodb');
const { createClient } = require('redis');
const { validateEnvironment } = require('../dist/config/environment');
const { setupMongoSchema } = require('../dist/infrastructure/mongodb/schema');

const backend = path.resolve(__dirname, '..');
const frontend = path.resolve(backend, '..', 'Frontend');
const frontendRequire = createRequire(path.join(frontend, 'package.json'));
const { chromium, devices, expect } = frontendRequire('@playwright/test');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const apiPort = Number(process.env.BROWSER_API_PORT ?? 4201);
const webPort = Number(process.env.BROWSER_WEB_PORT ?? 3101);
const apiOrigin = `http://localhost:${apiPort}`;
const webOrigin = `http://localhost:${webPort}`;
async function navigate(page, url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try { return await page.goto(url); }
    catch (error) {
      // Chromium can briefly suspend network I/O after a mobile full-page capture.
      if (attempt !== 0 || !String(error.message).includes('ERR_NETWORK_IO_SUSPENDED')) throw error;
      await pause(250);
    }
  }
}

async function requireFreePort(port) {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', () => reject(new Error(`Port ${port} is in use; stop that local development server first`)));
    server.listen(port, () => server.close(resolve));
  });
}
function start(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.resume();
  child.stderr.resume();
  child.on('error', () => { child.failedToStart = true; });
  return child;
}
async function waitForServer(child, url) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.failedToStart || child.exitCode !== null || child.signalCode !== null) throw new Error('Verification server stopped before it was ready');
    try { if ((await fetch(url, { signal: AbortSignal.timeout(3000) })).ok) return; } catch {}
    await pause(500);
  }
  throw new Error('Verification server did not become ready');
}
async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    child.once('exit', resolve);
    child.kill();
  });
}

async function main() {
  const env = validateEnvironment(process.env);
  if (!fs.existsSync(path.join(frontend, '.next-browser', 'BUILD_ID'))) throw new Error('Build the frontend with NEXT_TEST_BUILD=browser and the isolated browser API URL before running browser checks');
  await requireFreePort(apiPort);
  await requireFreePort(webPort);
  const token = randomUUID();
  const database = `elementry_test_browser_${token.slice(0, 8)}`;
  const prefix = `commerce:test:browser:${token}:`;
  const mongo = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const redis = createClient({ url: env.REDIS_URL, socket: { connectTimeout: 5000, reconnectStrategy: false } });
  redis.on('error', () => {});
  const productId = randomUUID();
  const emails = [];
  const orderIds = [];
  const itemIds = [];
  let apiProcess;
  let webProcess;
  let browser;
  let context;
  let mongoConnected = false;
  try {
    await Promise.all([mongo.connect().then(() => { mongoConnected = true; }), redis.connect()]);
    const db = mongo.db(database);
    await setupMongoSchema(db);
    const now = new Date();
    await db.collection('products').insertOne({ _id: productId, sku: `BROWSER-${token}`, name: 'Browser Verification Camera', brand: 'Panasonic', description: 'Temporary live verification fixture', price: Decimal128.fromString('19.90'), currency: 'INR', stock: 3, active: true, createdAt: now, updatedAt: now });
    apiProcess = start([path.join(backend, 'dist', 'main.js')], backend, {
      ...process.env, NODE_ENV: 'test', PORT: String(apiPort), MONGODB_DATABASE: database, REDIS_PREFIX: prefix,
      APP_ORIGINS: webOrigin, COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '', LOG_LEVEL: 'silent',
      RATE_LIMIT_MAX: '1000', AUTH_RATE_LIMIT_MAX: '100',
    });
    await waitForServer(apiProcess, `${apiOrigin}/api/v1/health/ready`);
    const frontEnv = { ...process.env, NODE_ENV: 'production', NEXT_TEST_BUILD: 'browser', NEXT_PUBLIC_API_URL: `${apiOrigin}/api/v1`, NEXT_PUBLIC_APP_URL: webOrigin };
    for (const key of ['MONGODB_URI', 'MONGODB_DATABASE', 'REDIS_URL', 'SESSION_SECRET']) delete frontEnv[key];
    webProcess = start([frontendRequire.resolve('next/dist/bin/next'), 'start', '-p', String(webPort)], frontend, frontEnv);
    await waitForServer(webProcess, `${webOrigin}/login`);
    browser = await chromium.launch({ headless: true });
    for (const [name, options] of [['desktop', { viewport: { width: 1440, height: 1000 } }], ['mobile', devices['Pixel 7']]]) {
      if (process.env.BROWSER_CHECK !== 'brands') console.log(`${name}: checking live registration, session, logout, login and catalog`);
      context = await browser.newContext(options);
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(40000);
      if (process.env.BROWSER_CHECK === 'brands') {
        console.log(`${name}: checking brand directory, real MongoDB filters and product details`);
        await navigate(page, webOrigin + '/');
        const directory = page.getByRole('list', { name: 'Brands and product lines' });
        await expect(directory.getByRole('listitem')).toHaveCount(43);
        await expect(directory.getByRole('link', { name: 'Harmonic official website (opens in a new tab)', exact: true })).toHaveAttribute('href', 'https://www.harmonicinc.com/');
        const screenshots = path.join(backend, 'test-results'); fs.mkdirSync(screenshots, { recursive: true });
        await page.locator('#brands').screenshot({ path: path.join(screenshots, `brands-home-${name}.png`), style: 'header { visibility: hidden; }' });
        await directory.getByRole('link', { name: 'Browse Panasonic products', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Panasonic products', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
        await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('Verification');
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
        await expect(page.getByLabel('Filter by brand')).toHaveValue('Panasonic');
        await page.screenshot({ path: path.join(screenshots, `brands-products-${name}.png`), fullPage: true });
        await page.getByLabel('Filter by brand').selectOption('Canon');
        await page.getByRole('button', { name: 'Search', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
        await page.getByRole('link', { name: 'Clear', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
        await navigate(page, `${webOrigin}/products/browser-verification-camera--${productId}`);
        await expect(page.getByRole('link', { name: 'Panasonic', exact: true })).toHaveAttribute('href', '/products?brand=Panasonic');
        await expect(page.getByRole('link', { name: /Visit Panasonic official website/ })).toHaveAttribute('href', 'https://www.panasonic.com/in/');
        const filtered = await context.request.get(`${apiOrigin}/api/v1/products?brand=panasonic`);
        if (filtered.status() !== 200 || (await filtered.json()).data[0]?.brand !== 'Panasonic') throw new Error('Real API brand filter did not return persisted brand');
        await context.close(); context = undefined;
        console.log(`${name}: brand checks passed`);
        continue;
      }
      const email = `browser-${name}-${token}@example.com`;
      emails.push(email);
      const password = 'live browser verification password';
      await navigate(page, webOrigin + '/register');
      await page.getByLabel('Full name', { exact: true }).fill('Live Browser User');
      await page.getByLabel('Email address', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Create account', exact: true }).click();
      await page.waitForURL('**/account');
      await expect(page.getByRole('heading', { name: 'My account', level: 1, exact: true })).toBeVisible();
      await expect(page.getByText(email, { exact: true })).toBeVisible();
      const cookie = (await context.cookies()).find(cookie => cookie.name === 'sid');
      if (!cookie?.httpOnly) throw new Error('Expected an HttpOnly session cookie');
      const user = await db.collection('users').findOne({ email });
      if (!user || user.role !== 'CUSTOMER' || user.passwordHash === password) throw new Error('Registered user did not persist correctly');
      let sessionCount = 0;
      for await (const key of redis.scanIterator({ MATCH: `${prefix}session:*`, COUNT: 100 })) {
        sessionCount++;
        if (await redis.ttl(key) <= 0) throw new Error('Redis session has no expiry');
      }
      if (!sessionCount) throw new Error('Expected a persisted Redis session');
      await page.reload();
      await expect(page.getByText(email, { exact: true })).toBeVisible();
      const loggedOut = page.waitForResponse(response => response.url().endsWith('/auth/logout') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Sign out', exact: true }).click();
      if ((await loggedOut).status() !== 204) throw new Error('Browser logout failed');
      await expect(page.getByRole('banner').getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
      const replay = await context.request.get(apiOrigin + '/api/v1/auth/me', { headers: { Cookie: `sid=${cookie.value}` } });
      if (replay.status() !== 401) throw new Error('Logged-out session remained valid');
      await navigate(page, webOrigin + '/login');
      await page.getByLabel('Email address', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL('**/account');
      await expect(page.getByText(email, { exact: true })).toBeVisible();
      await navigate(page, webOrigin + '/products');
      await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
      await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('no-such-browser-product');
      await page.getByRole('button', { name: 'Search', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
      await navigate(page, `${webOrigin}/products/browser-verification-camera--${productId}`);
      await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Save to wishlist', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Saved to wishlist', exact: true })).toBeVisible();
      await navigate(page, webOrigin + '/account/wishlist');
      await expect(page.getByRole('heading', { name: 'Browser Verification Camera', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Remove from wishlist', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Nothing saved yet' })).toBeVisible();
      await navigate(page, webOrigin + '/account/profile');
      await page.getByLabel('Full name', { exact: true }).fill(`Updated ${name} Customer`);
      await page.getByLabel('Phone number', { exact: true }).fill('+919999999999');
      await page.getByRole('button', { name: 'Save profile', exact: true }).click();
      await expect(page.getByText('Profile saved.', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByLabel('Full name', { exact: true })).toHaveValue(`Updated ${name} Customer`);
      await navigate(page, webOrigin + '/account/addresses');
      await page.getByRole('button', { name: 'Add address', exact: true }).click();
      for (const [label, value] of [['Address label', 'Home'], ['Recipient name', 'Live Browser User'], ['Phone number', '+919999999999'], ['Address line 1', '123 Browser Test Road'], ['City', 'Delhi'], ['State / region', 'Delhi'], ['Postal code', '110001']]) await page.getByLabel(label, { exact: true }).fill(value);
      await page.getByRole('button', { name: 'Save address', exact: true }).click();
      await expect(page.getByText('Address saved.', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText('123 Browser Test Road', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await page.getByLabel('Address label', { exact: true }).fill('Updated home');
      await page.getByRole('button', { name: 'Save address', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Updated home', exact: true })).toBeVisible();
      await navigate(page, webOrigin + '/account/payment-methods');
      await page.getByRole('button', { name: 'Add UPI ID', exact: true }).click();
      await page.getByLabel('Payment label', { exact: true }).fill('Personal UPI');
      await page.getByLabel('UPI ID', { exact: true }).fill(`browser.${name}@bank`);
      await page.getByRole('button', { name: 'Save UPI details', exact: true }).click();
      await expect(page.getByText('UPI details saved.', { exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByText(`browser.${name}@bank`, { exact: true })).toBeVisible();
      const fulfilledId = randomUUID(); const pendingId = randomUUID(); const itemId = randomUUID();
      orderIds.push(fulfilledId, pendingId); itemIds.push(itemId);
      await db.collection('orders').insertMany([{ _id: fulfilledId, status: 'FULFILLED' }, { _id: pendingId, status: 'PENDING' }].map(order => ({ ...order, userId: user._id, total: Decimal128.fromString('19.90'), currency: 'INR', idempotencyKey: order._id, createdAt: now, updatedAt: now })));
      await db.collection('orderItems').insertOne({ _id: itemId, orderId: fulfilledId, productId, quantity: 1, unitPrice: Decimal128.fromString('19.90'), sku: 'PURCHASE-SNAPSHOT', name: 'Purchased Verification Camera' });
      await db.collection('orderTracking').insertOne({ _id: fulfilledId, userId: user._id, status: 'DELIVERED', carrier: 'Verification carrier', trackingNumber: `TRACK-${name}`, events: [{ id: randomUUID(), status: 'DELIVERED', note: 'Synthetic test delivery event', occurredAt: now }], updatedAt: now });
      await navigate(page, webOrigin + '/account/orders');
      await page.getByRole('link', { name: `Order #${fulfilledId.slice(0, 8).toUpperCase()}`, exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Purchased items', exact: true })).toBeVisible();
      await page.getByLabel('Reason for return', { exact: true }).fill('Synthetic browser return request');
      await page.getByRole('button', { name: 'Submit return request', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Return status', exact: true })).toBeVisible();
      await navigate(page, webOrigin + '/account/returns');
      await expect(page.getByText('Synthetic browser return request', { exact: true })).toBeVisible();
      await db.collection('returns').updateOne({ orderId: fulfilledId, userId: user._id }, { $set: { status: 'REFUND_PENDING', refundAmount: Decimal128.fromString('19.90'), reviewNote: 'Synthetic refund record; no funds moved', updatedAt: new Date() } });
      await page.reload();
      await expect(page.getByText(/Refund pending:/)).toBeVisible();
      await navigate(page, webOrigin + '/account/tracking');
      await expect(page.getByText(`Verification carrier · Tracking number: TRACK-${name}`, { exact: true })).toBeVisible();
      await navigate(page, webOrigin + '/account/settings');
      await page.getByLabel('Offers and product news', { exact: true }).check();
      await page.getByRole('button', { name: 'Save preferences', exact: true }).click();
      await expect(page.getByText('Preferences saved.', { exact: true })).toBeVisible();
      await page.reload(); await expect(page.getByLabel('Offers and product news', { exact: true })).toBeChecked();
      await navigate(page, webOrigin + '/account');
      await expect(page.getByRole('heading', { name: 'Your account, at a glance', exact: true })).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole('link', { name: /^Orders\s*2$/ })).toBeVisible();
      const navigation = page.getByRole('navigation', { name: 'Customer account', exact: true });
      for (const label of ['My Profile', 'My Orders', 'Wishlist', 'Saved Addresses', 'Payment Methods', 'Order Tracking', 'Returns and Refunds', 'Account Settings']) await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
      if (!await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)) throw new Error('Account page overflows the viewport');
      const screenshots = path.join(backend, 'test-results'); fs.mkdirSync(screenshots, { recursive: true });
      await page.screenshot({ path: path.join(screenshots, `account-${name}.png`), fullPage: true });
      await navigate(page, webOrigin + '/account/settings');
      const other = await browser.newContext(options);
      try {
        const csrf = await other.request.get(apiOrigin + '/api/v1/auth/csrf');
        const signedIn = await other.request.post(apiOrigin + '/api/v1/auth/login', { headers: { 'X-CSRF-Token': (await csrf.json()).csrfToken }, data: { email, password } });
        if (signedIn.status() !== 200) throw new Error('Second account session failed');
        await page.getByLabel('Current password', { exact: true }).fill(password);
        await page.getByLabel('New password', { exact: true }).fill('updated live browser verification password');
        await page.getByRole('button', { name: 'Change password', exact: true }).click();
        await page.waitForURL('**/login**');
        if ((await other.request.get(apiOrigin + '/api/v1/auth/me')).status() !== 401) throw new Error('Password change did not revoke another browser session');
        await page.getByLabel('Email address', { exact: true }).fill(email);
        await page.getByLabel('Password', { exact: true }).fill('updated live browser verification password');
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.waitForURL('**/account**');
        await expect(page.getByRole('heading', { name: 'My account', level: 1, exact: true })).toBeVisible();
        await navigate(page, webOrigin + '/account/settings');
        await page.getByLabel('Current password', { exact: true }).fill('updated live browser verification password');
        await page.getByLabel('New password', { exact: true }).fill('short');
        await page.getByRole('button', { name: 'Sign out all devices', exact: true }).click();
        await page.waitForURL('**/login**');
      } finally { await other.close(); }
      console.log(`${name}: passed`);
      await context.close();
      context = undefined;
    }
    console.log('Live browser checks passed against MongoDB Atlas and Redis.');
  } catch (error) {
    if (context) {
      const page = context.pages().at(-1);
      if (page) {
        console.error(JSON.stringify({ browserUrl: page.url(), alerts: await page.locator('[role="alert"]').allTextContents().catch(() => []) }));
        const screenshots = path.join(backend, 'test-results'); fs.mkdirSync(screenshots, { recursive: true });
        await page.screenshot({ path: path.join(screenshots, 'account-failure.png'), fullPage: true }).catch(() => {});
      }
    }
    throw error;
  } finally {
    try {
      if (context) await context.close();
      if (browser) await browser.close();
      await Promise.all([stop(webProcess), stop(apiProcess)]);
      if (mongoConnected) {
        const db = mongo.db(database);
        await db.collection('returns').deleteMany({ orderId: { $in: orderIds } });
        await db.collection('orderTracking').deleteMany({ _id: { $in: orderIds } });
        await db.collection('orderItems').deleteMany({ _id: { $in: itemIds } });
        await db.collection('orders').deleteMany({ _id: { $in: orderIds } });
        const users = await db.collection('users').find({ email: { $in: emails } }).toArray();
        await db.collection('customerAccounts').deleteMany({ _id: { $in: users.map(user => user._id) } });
        await db.collection('users').deleteMany({ email: { $in: emails } });
        await db.collection('products').deleteOne({ _id: productId });
      }
      if (redis.isReady) for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) await redis.del(key);
    } finally {
      await mongo.close();
      if (redis.isOpen) await redis.disconnect();
    }
  }
}
main().catch(error => {
  console.error(`Live browser check failed (${error.name}). ${error.message?.replace(/redis(?:s)?:\/\/\S+|mongodb(?:\+srv)?:\/\/\S+/g, '[redacted]') ?? ''}`);
  process.exitCode = 1;
});
