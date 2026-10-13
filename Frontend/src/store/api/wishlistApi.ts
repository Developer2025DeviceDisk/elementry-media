import { baseApi } from './baseApi';
import type { Product } from '@/types/product';
export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWishlist: build.query<Product[], void>({
      query: () => 'wishlist',
      providesTags: ['Wishlist'],
    }),
    addToWishlist: build.mutation<void, string>({
      query: (productId) => ({ url: 'wishlist/items', method: 'POST', body: { productId } }),
      invalidatesTags: ['Wishlist', 'Account'],
    }),
    removeFromWishlist: build.mutation<void, string>({
      query: (id) => ({ url: `wishlist/items/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['Wishlist', 'Account'],
    }),
  }),
});
export const { useGetWishlistQuery, useAddToWishlistMutation, useRemoveFromWishlistMutation } =
  wishlistApi;
