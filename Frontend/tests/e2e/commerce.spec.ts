import { test, expect } from '@playwright/test';
import { mockApi, product, slug } from './api-fixture';

test('register validates inputs and establishes a session', async ({ page }) => {
  await mockApi(page, { signedIn: false });
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await page.getByLabel('Full name').fill('New Customer');
  await page.getByLabel('Email address').fill('new@example.test');
  await page.getByLabel('Password', { exact: true }).fill('long-secure-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByText('Welcome back, New Customer.')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Customer account' })
    .getByRole('link', { name: 'My Profile', exact: true })
    .click();
  await expect(page.getByLabel('Full name')).toHaveValue('New Customer');
});
test('login follows a protected redirect and logout removes access', async ({ page }) => {
  const state = await mockApi(page, { signedIn: false });
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.getByLabel('Email address').fill('customer@example.test');
  await page.getByLabel('Password', { exact: true }).fill('long-secure-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/account\/orders$/);
  await expect(page.getByText('No orders yet')).toBeVisible();
  if (!(await page.getByRole('button', { name: 'Sign out', exact: true }).isVisible())) {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
  }
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(state.signedIn).toBe(false);
});
test('search sends backend filters and debounced suggestions', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto('/search');
  await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('microphone');
  await expect(page.getByRole('list', { name: 'Search suggestions' })).toBeVisible();
  await page.getByRole('button', { name: 'Search products' }).click();
  await expect(page).toHaveURL(/q=microphone/);
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toBeVisible();
  await page.getByLabel('Sort by').selectOption('price-asc');
  await expect(page).toHaveURL(/sort=price-asc/);
  expect(state.requests.some((request) => request.path === 'search/suggestions')).toBe(true);
});
test('product details render SEO data and cart updates use the backend cache', async ({ page }) => {
  const state = await mockApi(page);
  await page.goto(`/products/${slug}`);
  await expect(page.getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  await expect(page).toHaveTitle('Wireless Microphone | Elementry Media Technology');
  await expect
    .poll(async () =>
      page
        .locator('script[type="application/ld+json"]')
        .evaluateAll((elements) =>
          elements.some(
            (element) => JSON.parse(element.textContent ?? '{}')['@type'] === 'Product',
          ),
        ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect(page.getByText('Added to your cart.')).toBeVisible();
  await page.getByRole('link', { name: 'View your cart' }).click();
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
  await page.getByRole('button', { name: `Increase ${product.name} quantity` }).click();
  await expect.poll(() => state.cart.items[0].quantity).toBe(2);
  await expect(page.getByText('₹4,998.00')).toHaveCount(2);
  await page.getByRole('button', { name: `Decrease ${product.name} quantity` }).click();
  await expect.poll(() => state.cart.items[0].quantity).toBe(1);
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});
test('checkout creates a backend order and verifies payment before confirming', async ({
  page,
}) => {
  const state = await mockApi(page);
  state.cart.items = [{ id: 'item1', product, quantity: 1 }];
  state.cart.total = '2499.00';
  state.cart.subtotal = '2499.00';
  await page.route('https://checkout.stripe.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Provider checkout fixture</h1>' }),
  );
  await page.goto('/checkout');
  await page.getByLabel('Recipient name').fill('Test Customer');
  await page.getByLabel('Phone number').fill('9999999999');
  await page.getByLabel('Address line 1', { exact: true }).fill('123 Main Road');
  await page.getByLabel('City', { exact: true }).fill('Delhi');
  await page.getByLabel('State / region').fill('Delhi');
  await page.getByLabel('Postal code').fill('110001');
  await page.getByRole('button', { name: 'Continue to shipping' }).click();
  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await page.getByRole('button', { name: 'Continue to secure payment' }).click();
  await expect(page).toHaveURL('https://checkout.stripe.com/pay/test');
  const create = state.requests.find(
    (request) => request.path === 'orders' && request.method === 'POST',
  );
  expect(create?.body).toHaveProperty('idempotencyKey');
  expect(create?.body).not.toHaveProperty('total');
  await page.goto('/checkout/success?orderId=order-1&paymentId=payment1');
  await expect(page.getByText('Payment verified. Your order is confirmed.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Verify payment' }).click();
  await expect(page.getByText('Payment verified. Your order is confirmed.')).toBeVisible();
  await page.getByRole('link', { name: 'View order' }).click();
  await expect(page.getByText('paid', { exact: true })).toBeVisible();
  await page.goto('/orders');
  await expect(page.getByRole('link', { name: 'Order #ORDER-1', exact: true })).toBeVisible();
});
test('an unverified payment does not show a success state', async ({ page }) => {
  const state = await mockApi(page);
  state.paymentVerified = false;
  await page.goto('/checkout/success?orderId=order-1&paymentId=payment1');
  await page.getByRole('button', { name: 'Verify payment' }).click();
  await expect(
    page.getByText('Payment is still pending. You can check again shortly.'),
  ).toBeVisible();
  await expect(page.getByText('Payment verified. Your order is confirmed.')).toHaveCount(0);
});
test('customers cannot render the admin workspace', async ({ page }) => {
  await mockApi(page);
  await page.goto('/admin/products');
  await expect(page.getByText('You do not have permission to perform this action.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create product' })).toHaveCount(0);
});
test('admin login, product creation and updates, and order management', async ({ page }) => {
  const state = await mockApi(page, { signedIn: false, admin: true });
  state.orders = [
    {
      id: 'order-1',
      status: 'PAID',
      total: '2499.00',
      currency: 'INR',
      createdAt: '2026-10-07T00:00:00.000Z',
      items: [],
    },
  ];
  await page.goto('/login?next=%2Fadmin%2Fproducts');
  await page.getByLabel('Email address').fill('admin@example.test');
  await page.getByLabel('Password', { exact: true }).fill('long-secure-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await page.getByRole('button', { name: 'Create product' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Studio Headphones');
  await page.getByLabel('SKU', { exact: true }).fill('HEAD-001');
  await page.getByLabel('Price', { exact: true }).fill('3999.00');
  await page.getByLabel('Stock', { exact: true }).fill('5');
  await page.getByRole('button', { name: 'Save product' }).click();
  const row = page.getByRole('row').filter({ hasText: 'Studio Headphones' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Studio Headphones Pro');
  await page.getByRole('button', { name: 'Save product' }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Studio Headphones Pro' })).toBeVisible();
  await page.goto('/admin/orders');
  await page.getByLabel('Status for order order-1').selectOption('FULFILLED');
  await expect.poll(() => state.orders[0].status).toBe('FULFILLED');
});
test('empty and error states remain readable without leaking backend errors', async ({ page }) => {
  const state = await mockApi(page, { emptyProducts: true });
  await page.goto('/search?q=missing');
  await expect(page.getByText('No products found')).toBeVisible();
  state.failureStatus = 500;
  await page.goto('/search?q=failure');
  await expect(page.getByText('Something went wrong. Please try again.')).toBeVisible();
  await expect(page.getByText('PRIVATE STACK TRACE')).toHaveCount(0);
  state.failureStatus = null;
  state.products = [{ ...product }];
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
});
test('password recovery and reset forms use API mutations', async ({ page }) => {
  await mockApi(page, { signedIn: false });
  await page.goto('/forgot-password');
  await page.getByLabel('Email address').fill('customer@example.test');
  await page.getByRole('button', { name: 'Send reset instructions' }).click();
  await expect(
    page.getByText('If an account exists for that address, you’ll receive reset instructions.'),
  ).toBeVisible();
  await page.goto('/reset-password?token=test-reset');
  await page.getByLabel('New password', { exact: true }).fill('another-long-password');
  await page.getByLabel('Confirm password').fill('another-long-password');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Your password was reset. You can now sign in.')).toBeVisible();
});
