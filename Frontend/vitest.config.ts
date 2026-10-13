import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_API_URL: 'http://localhost:4100/api/v1',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3001',
      NEXT_PUBLIC_COMMERCE_API_ENABLED: 'true',
      NEXT_PUBLIC_SEARCH_API_ENABLED: 'true',
      NEXT_PUBLIC_ADMIN_API_ENABLED: 'true',
    },
    restoreMocks: true,
  },
});
