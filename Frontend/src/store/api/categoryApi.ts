import { baseApi } from './baseApi';
import type { Category } from '@/types/product';
export const categoryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => 'categories',
      providesTags: ['Category'],
    }),
    getCategoryBySlug: build.query<Category, string>({
      query: (slug) => `categories/slug/${encodeURIComponent(slug)}`,
      providesTags: (result) => (result ? [{ type: 'Category', id: result.id }] : []),
    }),
  }),
});
export const { useGetCategoriesQuery, useGetCategoryBySlugQuery } = categoryApi;
