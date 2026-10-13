import { baseApi } from './baseApi';
import type { Cart } from '@/types/cart';
export interface Coupon {
  id: string;
  code: string;
  percentOff: number;
  expiresAt: string;
}
export const couponApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    applyCoupon: build.mutation<Cart, string>({
      query: (code) => ({ url: 'cart/coupon', method: 'POST', body: { code } }),
      invalidatesTags: ['Cart'],
    }),
    removeCoupon: build.mutation<Cart, void>({
      query: () => ({ url: 'cart/coupon', method: 'DELETE' }),
      invalidatesTags: ['Cart'],
    }),
  }),
});
export const { useApplyCouponMutation, useRemoveCouponMutation } = couponApi;
