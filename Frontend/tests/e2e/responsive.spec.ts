import { test, expect } from '@playwright/test';
import { mockApi } from './api-fixture';
test('storefront fits the viewport and navigation is keyboard accessible', async ({
  page,
}, testInfo) => {
  await mockApi(page);
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Leading Broadcast System Integrator in India' }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  if (testInfo.project.name.startsWith('mobile')) {
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Mobile' })
      .getByRole('link', { name: 'Shop', exact: true })
      .click();
    await expect(page).toHaveURL(/\/products$/);
  }
  await page.screenshot({ path: testInfo.outputPath('storefront.png'), fullPage: true });
});
