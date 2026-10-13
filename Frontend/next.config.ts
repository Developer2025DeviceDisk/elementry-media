import type { NextConfig } from 'next';

const config: NextConfig = {
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
