import { test, expect } from '@playwright/test';
import { mockApi } from './api-fixture';

test('hero controls and FAQ operate without leaving the storefront', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause slideshow' }).click();
  await page.getByRole('button', { name: 'Next slide' }).click();
  await expect(
    page.getByRole('heading', { name: 'Smart Classes, Lecture Capture & Video Conferencing' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Slide 3', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Audio-Video Studios, Built End to End' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Previous slide' }).click();
  await expect(
    page.getByRole('heading', { name: 'Smart Classes, Lecture Capture & Video Conferencing' }),
  ).toBeVisible();
  await page.locator('summary').filter({ hasText: 'When was Elementry Media founded?' }).click();
  await expect(
    page.getByText('Elementry Media Technology was founded in 2016.', { exact: true }),
  ).toBeVisible();
});

test('catalog search renders server API results and a real empty state', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill('microphone');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/q=microphone/);
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search products', exact: true })
    .fill('no-such-equipment');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No products found' })).toBeVisible();
  await page.getByRole('link', { name: 'Clear', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Wireless Microphone' })).toBeVisible();
});
