import { test, expect } from '@playwright/test';
import content from '../../../Backend/catalog/mine-a320h.json' with { type: 'json' };
import { mockApi } from './api-fixture';

test('A320H appears in Show with sale pricing and its full product content', async ({ page }) => {
  await mockApi(page);
  await page.goto('/categories/show');
  const card = page.getByRole('article').filter({ hasText: content.name });
  await expect(card).toHaveCount(1);
  await expect(card.getByText('₹3,51,000.00', { exact: true })).toBeVisible();
  await expect(card.locator('del')).toHaveText('₹3,99,999.00');
  await expect
    .poll(() =>
      card
        .getByRole('img')
        .evaluate(
          (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
        ),
    )
    .toBe(true);
  await card.getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: content.name })).toBeVisible();
  await expect(page.getByRole('button', { name: /^View image \d+$/ })).toHaveCount(
    content.images.length,
  );
  for (let index = 0; index < content.images.length; index++) {
    const thumbnail = page.getByRole('button', { name: `View image ${index + 1}`, exact: true });
    await thumbnail.click();
    await expect(thumbnail).toHaveAttribute('aria-pressed', 'true');
    const selected = page.getByRole('img', { name: new RegExp(`image ${index + 1}$`) });
    await expect
      .poll(() =>
        selected.evaluate(
          (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await expect(page.getByRole('heading', { name: 'Key features' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Remote production', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Education and training', exact: true }),
  ).toBeVisible();
  await page.getByText('What input formats are supported by the A320H?', { exact: true }).click();
  await expect(page.getByText(content.faqs[4].answer, { exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('999');
  await expect(page.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('20');
  const whatsapp = new URL(
    (await page.getByRole('link', { name: 'Order on WhatsApp' }).getAttribute('href'))!,
  );
  expect(whatsapp.searchParams.get('text')).toContain(content.name);
  expect(whatsapp.searchParams.get('text')).toContain('Quantity: 20');
  expect(whatsapp.searchParams.get('text')).toContain('₹3,51,000.00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
