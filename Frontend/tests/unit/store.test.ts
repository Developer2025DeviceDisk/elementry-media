import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeStore } from '@/store';
import { baseApi } from '@/store/api/baseApi';
import { cartApi } from '@/store/api/cartApi';
import { authApi } from '@/store/api/authApi';
import { productApi } from '@/store/api/productApi';
import { setCsrfToken } from '@/store/slices/authSlice';
import { setAddress } from '@/store/slices/checkoutSlice';
import { apiErrorMessage } from '@/lib/api/errors';
import { safeRedirect, jsonLd } from '@/lib/utils';
import { validatedPaymentUrl } from '@/lib/constants/payment';
import { env } from '@/config/env';

const stores: ReturnType<typeof makeStore>[] = [];
function testStore() {
  const store = makeStore();
  stores.push(store);
  return store;
}
afterEach(() => {
  stores.forEach((store) => store.dispatch(baseApi.util.resetApiState()));
  stores.length = 0;
  vi.unstubAllGlobals();
});
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
describe('RTK Query session and cache behavior', () => {
  it('sends catalog text search while advanced search is disabled', async () => {
    const advancedSearch = env.search;
    env.search = false;
    const requests: Request[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        requests.push(request);
        return json({ data: [], page: 1, limit: 12 });
      }),
    );
    try {
      await testStore()
        .dispatch(
          productApi.endpoints.getProducts.initiate({
            page: 1,
            limit: 12,
            q: 'PTZ camera',
            category: 'cameras',
          }),
        )
        .unwrap();
      const params = new URL(requests[0].url).searchParams;
      expect(params.get('q')).toBe('PTZ camera');
      expect(params.get('category')).toBeNull();
      expect(requests[0].credentials).toBe('include');
    } finally {
      env.search = advancedSearch;
    }
  });
  it('shares a single CSRF bootstrap for parallel writes', async () => {
    let bootstraps = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        if (request.url.endsWith('/auth/csrf')) {
          bootstraps++;
          await new Promise((resolve) => setTimeout(resolve, 20));
          return json({ csrfToken: 'shared' });
        }
        expect(request.headers.get('X-CSRF-Token')).toBe('shared');
        return json({ id: 'cart', items: [] });
      }),
    );
    const store = testStore();
    await Promise.all(
      [1, 2].map((quantity) =>
        store
          .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 'p1', quantity }))
          .unwrap(),
      ),
    );
    expect(bootstraps).toBe(1);
  });
  it('isolates stores so session metadata never leaks between requests', () => {
    const first = testStore();
    const second = testStore();
    first.dispatch(setCsrfToken('first-session'));
    expect(second.getState().auth.csrfToken).toBeNull();
  });
  it('bootstraps CSRF before a write and includes cookies without storing cart data in a slice', async () => {
    const requests: Request[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        requests.push(request);
        return request.url.endsWith('/auth/csrf')
          ? json({ csrfToken: 'csrf-1' })
          : json({ id: 'cart', items: [] });
      }),
    );
    const store = testStore();
    await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 'p1', quantity: 1 }))
      .unwrap();
    expect(requests.map((request) => new URL(request.url).pathname)).toEqual([
      '/api/v1/auth/csrf',
      '/api/v1/cart/items',
    ]);
    expect(requests[1].headers.get('X-CSRF-Token')).toBe('csrf-1');
    expect(requests[1].credentials).toBe('include');
    expect(store.getState().cartUi).toEqual({ drawerOpen: false });
  });
  it('invalidates cart after writes without invalidating unrelated products', async () => {
    let cartReads = 0;
    let productReads = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (request: Request) => {
        if (request.url.includes('/products')) {
          productReads++;
          return json({ data: [], page: 1, limit: 12 });
        }
        if (request.method === 'GET') {
          cartReads++;
          return json({ id: 'cart', items: [] });
        }
        return json({ id: 'cart', items: [] });
      }),
    );
    const store = testStore();
    store.dispatch(setCsrfToken('csrf'));
    const cart = store.dispatch(cartApi.endpoints.getCart.initiate());
    const products = store.dispatch(
      productApi.endpoints.getProducts.initiate({ page: 1, limit: 12 }),
    );
    await Promise.all([cart.unwrap(), products.unwrap()]);
    await store
      .dispatch(cartApi.endpoints.addToCart.initiate({ productId: 'p1', quantity: 1 }))
      .unwrap();
    await vi.waitFor(() => expect(cartReads).toBe(2));
    expect(productReads).toBe(1);
    cart.unsubscribe();
    products.unsubscribe();
  });
  it('expires a session on 401 without replaying a non-idempotent mutation', async () => {
    const fetch = vi.fn(async () => json({}, 401));
    vi.stubGlobal('fetch', fetch);
    const store = testStore();
    store.dispatch(setCsrfToken('old'));
    await store.dispatch(cartApi.endpoints.addToCart.initiate({ productId: 'p1', quantity: 1 }));
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(store.getState().auth.sessionExpired).toBe(true);
    expect(store.getState().auth.csrfToken).toBeNull();
  });
  it('logout clears user-specific caches and checkout drafts after server success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    );
    const store = testStore();
    store.dispatch(setCsrfToken('csrf'));
    store.dispatch(
      setAddress({
        name: 'Customer',
        phone: '9999999999',
        line1: '1 Main Road',
        city: 'Delhi',
        region: 'Delhi',
        postalCode: '110001',
        country: 'IN',
      }),
    );
    await store.dispatch(
      authApi.util.upsertQueryData('getCurrentUser', undefined, {
        user: { id: 'u1', name: 'Customer', email: 'user@example.test', role: 'CUSTOMER' },
      }),
    );
    await store.dispatch(authApi.endpoints.logout.initiate()).unwrap();
    await vi.waitFor(() => expect(store.getState().checkoutUi.address).toBeNull());
    expect(authApi.endpoints.getCurrentUser.select()(store.getState()).data).toBeUndefined();
  });
});
describe('safe display and navigation', () => {
  it.each([400, 401, 403, 404, 409, 422, 429, 500, 'FETCH_ERROR', 'TIMEOUT_ERROR'])(
    'sanitizes %s responses',
    (status) => {
      const message = apiErrorMessage({ status, data: { message: 'secret database stack' } });
      expect(message).not.toContain('secret');
      expect(message.length).toBeGreaterThan(5);
    },
  );
  it('rejects external sign-in redirects and embedded script markup', () => {
    expect(safeRedirect('//evil.test')).toBe('/account');
    expect(safeRedirect('/\\evil.test')).toBe('/account');
    expect(safeRedirect('/orders')).toBe('/orders');
    expect(jsonLd({ name: '</script><script>' })).not.toContain('<');
  });
  it('only opens approved HTTPS provider hosts', () => {
    expect(validatedPaymentUrl('https://checkout.stripe.com/pay/test')).toContain(
      'checkout.stripe.com',
    );
    expect(() => validatedPaymentUrl('https://checkout.stripe.com.evil.test/pay')).toThrow();
    expect(() => validatedPaymentUrl('javascript:alert(1)')).toThrow();
  });
});
