import 'server-only';
import { cache } from 'react';
import { makeStore } from '@/store';
import { productApi } from '@/store/api/productApi';
import { categoryApi } from '@/store/api/categoryApi';
import type { ProductQuery } from '@/types/product';
import { shopCategories } from '@/lib/constants/categories';
import { getLegacyCategory, rejectsCategoryFilter } from './catalog-compat';
// An isolated RTK Query store for each server read; never forward private cookies to public catalog reads.
export const getCatalog = cache(
  async (page = 1, limit = 12, category?: string, q?: string, brand?: string) => {
    const store = makeStore();
    const params: ProductQuery = {
      page,
      limit,
      ...(category ? { category } : {}),
      ...(q ? { q } : {}),
      ...(brand ? { brand } : {}),
    };
    const request = store.dispatch(productApi.endpoints.getProducts.initiate(params));
    try {
      try {
        return await request.unwrap();
      } catch (error) {
        if (
          !category ||
          !shopCategories.some((item) => item.slug === category) ||
          !rejectsCategoryFilter(error)
        )
          throw error;
        return await getLegacyCategory(params, async (query) => {
          const fallback = store.dispatch(productApi.endpoints.getProducts.initiate(query));
          try {
            return await fallback.unwrap();
          } finally {
            fallback.unsubscribe();
          }
        });
      }
    } finally {
      request.unsubscribe();
      store.dispatch(productApi.util.resetApiState());
    }
  },
);
export const getProduct = cache(async (slug: string) => {
  const store = makeStore();
  const request = store.dispatch(productApi.endpoints.getProductBySlug.initiate(slug));
  try {
    return await request.unwrap();
  } finally {
    request.unsubscribe();
    store.dispatch(productApi.util.resetApiState());
  }
});
export const getCategory = cache(async (slug: string) => {
  const category = shopCategories.find((item) => item.slug === slug);
  if (category) return category;
  const store = makeStore();
  const request = store.dispatch(categoryApi.endpoints.getCategoryBySlug.initiate(slug));
  try {
    return await request.unwrap();
  } finally {
    request.unsubscribe();
    store.dispatch(categoryApi.util.resetApiState());
  }
});
