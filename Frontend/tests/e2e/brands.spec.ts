import { test, expect } from '@playwright/test';
import { brands, brandCatalogHref } from '../../src/lib/constants/brands';

test('home and catalog display every supplied brand with its official link', async ({ page }) => {
  await page.goto('/');
  const directory = page.getByRole('list', { name: 'Brands and product lines' });
  await expect(directory.getByRole('listitem')).toHaveCount(43);
  for (const brand of brands) {
    await expect(
      directory.getByRole('link', { name: `Browse ${brand.name} products`, exact: true }),
    ).toHaveAttribute('href', brandCatalogHref(brand.name));
    await expect(
      directory.getByRole('link', {
        name: `${brand.name} official website (opens in a new tab)`,
        exact: true,
      }),
    ).toHaveAttribute('href', brand.url);
  }
  await page.goto('/products');
  await page.locator('summary').filter({ hasText: 'Browse all 43 brands' }).click();
  await expect(directory.getByRole('listitem')).toHaveCount(43);
  await expect(
    directory.getByRole('link', { name: 'Browse RØDE products', exact: true }),
  ).toBeVisible();
  await directory.getByRole('link', { name: 'Browse RØDE products', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'RØDE products', exact: true })).toBeVisible();
  await expect(page.getByLabel('Filter by brand')).toHaveValue('RØDE');
});

test('brand and search combine, empty inventory stays honest, and clear restores the catalog', async ({
  page,
}) => {
  await page.goto('/products');
  await page.getByLabel('Filter by brand').selectOption('Sennheiser');
  await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('microphone');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/brand=Sennheiser/);
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toBeVisible();
  await page.getByLabel('Filter by brand').selectOption('Canon');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contact our team', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toBeVisible();
  await expect(page.getByLabel('Filter by brand')).toHaveValue('');
});

test('product details show their stored brand and manufacturer link', async ({ page }) => {
  await page.goto('/products/wireless-microphone--11111111-1111-4111-8111-111111111111');
  await expect(page.getByRole('link', { name: 'Sennheiser', exact: true })).toHaveAttribute(
    'href',
    brandCatalogHref('Sennheiser'),
  );
  await expect(
    page.getByRole('link', { name: /Visit Sennheiser official website/ }),
  ).toHaveAttribute('href', 'https://en-in.sennheiser.com/');
});
