import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/profile',
        '/orders',
        '/checkout',
        '/cart',
        '/wishlist',
        '/search',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
