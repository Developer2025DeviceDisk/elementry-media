import type { MetadataRoute } from 'next';
import { env } from '@/config/env';
import { getCatalog } from '@/lib/api/catalog.server';
import { productSlug } from '@/lib/utils';
import { shopCategories } from '@/lib/constants/categories';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: env.appUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${env.appUrl}/products`, changeFrequency: 'daily', priority: 0.9 },
    ...shopCategories.map((category) => ({
      url: `${env.appUrl}/categories/${category.slug}`,
      priority: 0.8,
    })),
  ];
  // A maximum of 49,902 URLs stays below the 50,000 sitemap limit. Larger catalogs need a backend cursor/sitemap endpoint.
  for (let page = 1; page <= 499; page++) {
    const products = await getCatalog(page, 100); // Let outages fail rather than publishing a silently truncated sitemap.
    entries.push(
      ...products.data.map((product) => ({
        url: `${env.appUrl}/products/${productSlug(product)}`,
        lastModified: product.updatedAt,
        priority: 0.7,
      })),
    );
    if (products.data.length < 100) break;
  }
  return entries;
}
