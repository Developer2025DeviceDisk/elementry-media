import { baseApi } from './baseApi';
import type { Cart, AddCartItem } from '@/types/cart';
export const cartApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCart: build.query<Cart, void>({ query: () => 'cart', providesTags: ['Cart'] }),
    addToCart: build.mutation<Cart, AddCartItem>({
      query: (body) => ({ url: 'cart/items', method: 'POST', body }),
      invalidatesTags: ['Cart'],
    }),
    updateCartItem: build.mutation<Cart, { id: string; quantity: number }>({
      query: ({ id, ...body }) => ({
        url: `cart/items/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: build.mutation<Cart, string>({
      query: (id) => ({ url: `cart/items/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
    clearCart: build.mutation<Cart, void>({
      query: () => ({ url: 'cart', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});
export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} = cartApi;
