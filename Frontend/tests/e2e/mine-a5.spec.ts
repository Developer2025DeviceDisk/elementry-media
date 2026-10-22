import { test, expect } from '@playwright/test';
import content from '../../../Backend/catalog/mine-a5.json' with { type: 'json' };
import type { Product } from '@/types/product';
import { mockApi } from './api-fixture';

const camera: Product = {
  ...content,
  id: 'a5c34b17-4d83-4d4d-a8fe-cf86be01c906',
  stock: 10,
  active: true,
  createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z',
};
const path = `/products/mine-a5-4k-network-bonding-streaming-camera--${camera.id}`;

test('Shop Show category has minimal sale cards and links to the full camera page', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/products');
  await page
    .getByRole('navigation', { name: 'Shop categories' })
    .getByRole('link', { name: 'Show', exact: true })
    .click();
  await expect(page).toHaveURL(/\/categories\/show$/);
  const card = page.getByRole('article').filter({ hasText: camera.name });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole('img', { name: camera.name })).toBeVisible();
  await expect(card.getByText('₹69,000.00', { exact: true })).toBeVisible();
  await expect(card.locator('del')).toHaveText('₹1,00,000.00');
  await expect(card.getByText(camera.features![0])).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toHaveCount(0);
  await card.getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: camera.name })).toBeVisible();
  await page.getByRole('button', { name: 'View image 2', exact: true }).click();
  await expect(
    page.getByRole('img', { name: `${camera.name} — image 2`, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Built for your workflow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What’s in the box' })).toBeVisible();
  await page.getByText('What accessories are included?', { exact: true }).click();
  await expect(page.getByText(camera.faqs![8].answer, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^View image \d+$/ })).toHaveCount(
    content.images.length,
  );
  for (const [index, src] of content.images.entries()) {
    const thumbnail = page.getByRole('button', { name: `View image ${index + 1}`, exact: true });
    await thumbnail.click();
    await expect(thumbnail).toHaveAttribute('aria-pressed', 'true');
    const selectedImage = page.getByRole('img', {
      name: `${camera.name} — image ${index + 1}`,
      exact: true,
    });
    await expect
      .poll(() =>
        selectedImage.evaluate(
          (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
    await expect(selectedImage).toHaveAttribute('src', new RegExp(encodeURIComponent(src)));
  }
});

test('camera quantity reaches cart, Buy now, and the encoded business WhatsApp order', async ({
  page,
}) => {
  const state = await mockApi(page);
  state.products.push(camera);
  await page.goto(path);
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  const whatsapp = page.getByRole('link', { name: 'Order on WhatsApp' });
  const url = new URL((await whatsapp.getAttribute('href'))!);
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/919015747301');
  expect(url.searchParams.get('text')).toContain('Quantity: 2');
  expect(url.searchParams.get('text')).toContain('Unit price: ₹69,000.00');
  expect(url.searchParams.get('text')).toContain(camera.name);
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await expect.poll(() => state.cart.items[0]?.quantity).toBe(2);
  expect(state.cart.items[0].product.id).toBe(camera.id);
  await page.keyboard.press('Escape');
  await page.goto(path);
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('999');
  await expect(page.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('10');
  await page.getByRole('button', { name: 'Buy now', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  expect(
    state.requests
      .filter((request) => request.path === 'cart/items' && request.method === 'POST')
      .at(-1)?.body,
  ).toMatchObject({ productId: camera.id, quantity: 10 });
});

test('camera detail fits phone, tablet, and desktop viewports', async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto(path);
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('2');
  await page.getByRole('button', { name: 'Decrease quantity', exact: true }).click();
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { level: 1, name: camera.name })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`mine-a5-${width}.png`), fullPage: true });
  }
});

test('unconfirmed camera stock prevents cart and Buy now while allowing a WhatsApp enquiry', async ({
  page,
}) => {
  const state = await mockApi(page);
  await page.goto(path.replace('c906', 'c907'));
  await expect(page.getByText('Availability: confirm with us', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Buy now', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Increase quantity', exact: true }).click();
  await expect(page.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('2');
  const whatsapp = new URL(
    (await page.getByRole('link', { name: 'Order on WhatsApp' }).getAttribute('href'))!,
  );
  expect(whatsapp.searchParams.get('text')).toContain('Quantity: 2');
  expect(state.requests.some((request) => request.path === 'cart/items')).toBe(false);
});

test('Buy now stays on the product when adding to cart fails', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/v1/cart/items', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Requested quantity is unavailable' }),
    }),
  );
  await page.goto(path);
  await page.getByRole('button', { name: 'Buy now', exact: true }).click();
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: 'This information has changed. Refresh and try again.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
});
