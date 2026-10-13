import { defineConfig, devices } from '@playwright/test';
const webPort = Number(process.env.E2E_WEB_PORT ?? 3102);
const apiPort = Number(process.env.E2E_API_PORT ?? 4102);
const webOrigin = `http://localhost:${webPort}`;
const apiOrigin = `http://localhost:${apiPort}`;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: webOrigin, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node tests/fixtures/api-server.mjs',
      url: `${apiOrigin}/api/v1/products`,
      env: { E2E_API_PORT: String(apiPort), E2E_FRONTEND_ORIGIN: webOrigin },
      reuseExistingServer: false,
    },
    {
      command: `node node_modules/next/dist/bin/next dev -p ${webPort}`,
      url: webOrigin,
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_TEST_BUILD: 'e2e',
        NEXT_PUBLIC_API_URL: `${apiOrigin}/api/v1`,
        NEXT_PUBLIC_APP_URL: webOrigin,
        NEXT_PUBLIC_COMMERCE_API_ENABLED: 'true',
        NEXT_PUBLIC_SEARCH_API_ENABLED: 'true',
        NEXT_PUBLIC_ADMIN_API_ENABLED: 'true',
        NEXT_PUBLIC_PASSWORD_RECOVERY_ENABLED: 'true',
      },
    },
  ],
});
