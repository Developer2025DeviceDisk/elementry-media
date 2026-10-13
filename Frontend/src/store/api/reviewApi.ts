import { baseApi } from './baseApi';
import type { Review } from '@/types/product';
import type { PageResult } from '@/types/common';
export const reviewApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<PageResult<Review>, { productId: string; page: number }>({
      query: ({ productId, page }) => ({
        url: `products/${encodeURIComponent(productId)}/reviews`,
        params: { page, limit: 10 },
      }),
      providesTags: (_, __, { productId }) => [{ type: 'Review', id: productId }],
    }),
    createReview: build.mutation<Review, { productId: string; rating: number; comment: string }>({
      query: ({ productId, ...body }) => ({
        url: `products/${encodeURIComponent(productId)}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_, __, { productId }) => [
        { type: 'Review', id: productId },
        { type: 'Product', id: productId },
      ],
    }),
  }),
});
export const { useGetReviewsQuery, useCreateReviewMutation } = reviewApi;
