import type { Product, ProductQuery } from '@/types/product';
import type { PageResult } from '@/types/common';
import { categoryProductSkus } from '@/lib/constants/product-content';

export function rejectsCategoryFilter(error: unknown): boolean {
  if (
    !error ||
    typeof error !== 'object' ||
    !('status' in error) ||
    error.status !== 400 ||
    !('data' in error)
  )
    return false;
  const data = error.data;
  if (!data || typeof data !== 'object' || !('message' in data)) return false;
  const messages = Array.isArray(data.message) ? data.message : [data.message];
  return messages.some((message: unknown) => message === 'property category should not exist');
}

// Older APIs have no category field/filter. Resolve only the store's known category SKUs
// through real API reads; never synthesize products or their current stock/prices.
export async function getLegacyCategory(
  query: ProductQuery,
  read: (query: ProductQuery) => Promise<PageResult<Product>>,
): Promise<PageResult<Product>> {
  const products: Product[] = [];
  for (const sku of categoryProductSkus(query.category ?? '')) {
    for (let page = 1; page <= 1000; page++) {
      const result = await read({
        page,
        limit: 100,
        q: sku,
        ...(query.brand ? { brand: query.brand } : {}),
      });
      const product = result.data.find((product) => product.sku === sku);
      if (product) {
        const matchesSearch =
          !query.q ||
          [product.name, product.sku, product.description ?? ''].some((value) =>
            value.toLowerCase().includes(query.q!.toLowerCase()),
          );
        if (product.active && matchesSearch) products.push(product);
        break;
      }
      if (result.data.length < 100) break;
      if (page === 1000) throw new Error('Category lookup exceeded the supported catalog size');
    }
  }
  products.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  return {
    data: products.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total: products.length,
  };
}
