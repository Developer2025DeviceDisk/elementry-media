import type { NextConfig } from 'next';
import { resolveAppUrl } from './src/config/app-url';

const config: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL?.trim() || 'https://elementry-media.onrender.com/api/v1',
    NEXT_PUBLIC_APP_URL: resolveAppUrl({
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      productionDomain: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      deploymentDomain: process.env.VERCEL_URL,
    }),
  },
  distDir:
    process.env.NEXT_TEST_BUILD === 'browser'
      ? '.next-browser'
      : process.env.NEXT_TEST_BUILD === 'e2e'
        ? '.next-e2e'
        : '.next',
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: { root: process.cwd() },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
