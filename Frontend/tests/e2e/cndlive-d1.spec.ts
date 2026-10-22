import { test, expect } from '@playwright/test';
import content from '../../../Backend/catalog/cndlive-d1.json' with { type: 'json' };
import { mockApi } from './api-fixture';

test('CNDLive D1 has sale pricing, four working photos, technical highlights and ordering details', async ({
  page,
}) => {
  await mockApi(page);
  await page.goto('/categories/show');
  const card = page.getByRole('article').filter({ hasText: content.name });
  await expect(card).toHaveCount(1);
  await expect(card.getByText('₹50,000.00', { exact: true })).toBeVisible();
  await expect(card.locator('del')).toHaveText('₹1,00,000.00');
  await card.getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: content.name })).toBeVisible();
  await expect(page.getByRole('button', { name: /^View image \d+$/ })).toHaveCount(4);
  for (let index = 0; index < content.images.length; index++) {
    await page.getByRole('button', { name: `View image ${index + 1}`, exact: true }).click();
    const selected = page.getByRole('img', { name: new RegExp(`image ${index + 1}$`) });
    await expect
      .poll(() =>
        selected.evaluate(
          (img) => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  const specs = page.getByRole('region', { name: 'Technical highlights' });
  await expect(specs.getByRole('term')).toHaveCount(11);
  await expect(specs.getByText('140 × 131.2 × 43.7mm', { exact: true })).toBeVisible();
  await expect(page.locator('section[aria-labelledby="product-faqs"] details')).toHaveCount(10);
  await page
    .getByText('What video resolutions does the CNDLive D1 support?', { exact: true })
    .click();
  await expect(page.getByText(content.faqs[0].answer, { exact: true })).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Quantity', exact: true }).fill('999');
  await expect(page.getByRole('spinbutton', { name: 'Quantity', exact: true })).toHaveValue('10');
  const whatsapp = new URL(
    (await page.getByRole('link', { name: 'Order on WhatsApp' }).getAttribute('href'))!,
  );
  expect(whatsapp.searchParams.get('text')).toContain(content.name);
  expect(whatsapp.searchParams.get('text')).toContain('Quantity: 10');
  expect(whatsapp.searchParams.get('text')).toContain('₹50,000.00');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
