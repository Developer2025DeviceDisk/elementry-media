import { baseApi } from './baseApi';
import { env } from '@/config/env';
import type { Product, ProductQuery, SearchSuggestion } from '@/types/product';
import type { PageResult } from '@/types/common';
export const productApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<PageResult<Product>, ProductQuery>({
      query: (params) => ({
        url: 'products',
        params: env.search
          ? params
          : {
              page: params.page ?? 1,
              limit: params.limit ?? 20,
              ...(params.q ? { q: params.q } : {}),
              ...(params.brand ? { brand: params.brand } : {}),
            },
      }),
      providesTags: (result) => [
        { type: 'ProductList', id: 'LIST' },
        ...(result?.data.map(({ id }) => ({ type: 'Product' as const, id })) ?? []),
      ],
    }),
    getProductById: build.query<Product, string>({
      query: (id) => `products/${encodeURIComponent(id)}`,
      providesTags: (_, __, id) => [{ type: 'Product', id }],
    }),
    getProductBySlug: build.query<Product, string>({
      query: (slug) => {
        const id = slug.split('--').at(-1);
        return id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          ? `products/${id}`
          : `products/slug/${encodeURIComponent(slug)}`;
      },
      providesTags: (result) => (result ? [{ type: 'Product', id: result.id }] : []),
    }),
    getFeaturedProducts: build.query<PageResult<Product>, void>({
      query: () => ({ url: 'products/featured' }),
      providesTags: [{ type: 'ProductList', id: 'FEATURED' }],
    }),
    getRelatedProducts: build.query<PageResult<Product>, string>({
      query: (id) => `products/${encodeURIComponent(id)}/related`,
      providesTags: (_, __, id) => [{ type: 'ProductList', id: `RELATED-${id}` }],
    }),
    getSearchSuggestions: build.query<SearchSuggestion[], string>({
      query: (q) => ({ url: 'search/suggestions', params: { q } }),
      keepUnusedDataFor: 15,
    }),
  }),
});
export const {
  useGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductBySlugQuery,
  useGetFeaturedProductsQuery,
  useGetRelatedProductsQuery,
  useGetSearchSuggestionsQuery,
} = productApi;
