import type { Page } from '@playwright/test';
import productFixture from '../fixtures/product.json' with { type: 'json' };
import type { Product } from '@/types/product';
import type { User } from '@/types/auth';
import type { Cart } from '@/types/cart';
import type { Order } from '@/types/order';
import type { CustomerOrder } from '@/types/account';
export const product = productFixture as Product;
export const slug = `wireless-microphone--${product.id}`;
export async function mockApi(
  page: Page,
  options: { signedIn?: boolean; admin?: boolean; emptyProducts?: boolean } = {},
) {
  const state = {
    signedIn: options.signedIn ?? true,
    user: {
      id: 'u1',
      name: 'Test Customer',
      email: 'customer@example.test',
      role: options.admin ? 'ADMIN' : 'CUSTOMER',
    } as User,
    products: options.emptyProducts ? [] : [{ ...product }],
    cart: {
      id: 'cart1',
      items: [],
      currency: 'INR',
      subtotal: '0.00',
      discount: '0.00',
      tax: '0.00',
      shipping: '0.00',
      total: '0.00',
    } as Cart,
    orders: [] as Order[],
    requests: [] as { path: string; method: string; body: Record<string, unknown> | null }[],
    failureStatus: null as number | null,
    paymentVerified: true,
  };
  const customerOrder = (order: Order): CustomerOrder => ({
    ...order,
    updatedAt: order.createdAt,
    tracking: null,
    returnRequest: null,
    canCancel: order.status === 'PENDING',
    canReturn: order.status === 'FULFILLED',
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.product.price,
    })),
  });
  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1/', '');
    const method = request.method();
    const body = request.postData() ? (request.postDataJSON() as Record<string, unknown>) : null;
    state.requests.push({ path, method, body });
    const reply = async (json: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(json),
        headers: {
          'Access-Control-Allow-Origin': request.headers().origin ?? new URL(page.url()).origin,
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    if (path === 'auth/csrf') return reply({ csrfToken: 'test-csrf' });
    if (!['GET', 'OPTIONS'].includes(method) && !request.headers()['x-csrf-token'])
      return reply({ message: 'Missing CSRF' }, 403);
    if (path === 'auth/me')
      return reply(state.signedIn ? { user: state.user } : {}, state.signedIn ? 200 : 401);
    if (path === 'auth/login' || path === 'auth/register') {
      state.signedIn = true;
      if (typeof body?.name === 'string') state.user.name = body.name;
      return reply({ user: state.user, csrfToken: 'rotated-csrf' });
    }
    if (path === 'auth/logout') {
      state.signedIn = false;
      return route.fulfill({ status: 204 });
    }
    if (path === 'auth/forgot-password' || path === 'auth/reset-password')
      return reply({ message: 'Success' });
    if (state.failureStatus && path === 'products')
      return reply({ message: 'PRIVATE STACK TRACE' }, state.failureStatus);
    if (path === 'products') return reply({ data: state.products, page: 1, limit: 12 });
    if (path === 'search/suggestions') return reply([{ label: product.name, slug }]);
    if (path.endsWith('/reviews') && !path.startsWith('admin'))
      return reply({ data: [], page: 1, limit: 10 });
    if (!state.signedIn) return reply({}, 401);
    if (path === 'account')
      return reply({
        profile: { ...state.user, phone: null, createdAt: '2026-10-07T00:00:00Z' },
        counts: {
          orders: state.orders.length,
          wishlist: 0,
          addresses: 0,
          paymentMethods: 0,
          openReturns: 0,
        },
        recentOrders: state.orders.map(customerOrder),
      });
    if (path === 'account/profile')
      return reply({ ...state.user, phone: null, createdAt: '2026-10-07T00:00:00Z' });
    if (path === 'account/orders')
      return reply({
        data: state.orders.map(customerOrder),
        total: state.orders.length,
        page: 1,
        limit: 10,
      });
    if (path.startsWith('account/orders/')) {
      const order = state.orders.find((order) => order.id === path.split('/')[2]);
      return order ? reply(customerOrder(order)) : reply({}, 404);
    }
    if (path.startsWith('cart/items')) {
      if (method === 'POST')
        state.cart.items = [{ id: 'item1', product, quantity: Number(body?.quantity ?? 1) }];
      if (method === 'PATCH') state.cart.items[0].quantity = Number(body?.quantity);
      if (method === 'DELETE') state.cart.items = [];
      const total = state.cart.items
        .reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
        .toFixed(2);
      state.cart.subtotal = total;
      state.cart.total = total;
      return reply(state.cart);
    }
    if (path === 'cart') {
      if (method === 'DELETE') state.cart.items = [];
      return reply(state.cart);
    }
    if (path === 'orders' && method === 'POST') {
      const order: Order = {
        id: 'order-1',
        status: 'PENDING',
        total: state.cart.total,
        currency: 'INR',
        createdAt: '2026-10-07T00:00:00.000Z',
        items: [...state.cart.items],
      };
      state.orders = [order];
      return reply(order);
    }
    if (path === 'orders') return reply({ data: state.orders, page: 1, limit: 10 });
    if (path === 'orders/order-1') return reply(state.orders[0]);
    if (path === 'payments/session')
      return reply({
        id: 'payment1',
        orderId: 'order-1',
        checkoutUrl: 'https://checkout.stripe.com/pay/test',
      });
    if (path === 'payments/verify') {
      if (state.paymentVerified && state.orders[0]) state.orders[0].status = 'PAID';
      return reply({ verified: state.paymentVerified, orderId: 'order-1' });
    }
    if (path.startsWith('admin/') && state.user.role !== 'ADMIN') return reply({}, 403);
    if (path === 'admin/dashboard')
      return reply({ revenue: '2499.00', currency: 'INR', orders: 1, customers: 1, lowStock: 0 });
    if (path === 'admin/products' && method === 'POST') {
      state.products.push({
        ...product,
        ...body,
        id: '22222222-2222-4222-8222-222222222222',
      } as Product);
      return reply(state.products.at(-1));
    }
    if (path === 'admin/products') return reply({ data: state.products, page: 1, limit: 20 });
    if (path.startsWith('admin/products/') && method === 'PATCH') {
      const id = path.split('/').at(-1);
      const target = state.products.find((item) => item.id === id);
      if (target) Object.assign(target, body);
      return reply(target);
    }
    if (path === 'admin/orders') return reply({ data: state.orders, page: 1, limit: 20 });
    if (path === 'admin/orders/order-1' && method === 'PATCH') {
      state.orders[0].status = body?.status as Order['status'];
      return reply(state.orders[0]);
    }
    if (path === 'wishlist') return reply([]);
    return reply({}, 404);
  });
  return state;
}
