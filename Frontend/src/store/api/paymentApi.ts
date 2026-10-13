import { baseApi } from './baseApi';
import type { PaymentSession, PaymentVerification, PaymentStatus } from '@/types/payment';
export const paymentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createPayment: build.mutation<PaymentSession, { orderId: string }>({
      query: (body) => ({ url: 'payments/session', method: 'POST', body }),
    }),
    verifyPayment: build.mutation<PaymentStatus, PaymentVerification>({
      query: (body) => ({ url: 'payments/verify', method: 'POST', body }),
      invalidatesTags: (_, __, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'OrderList', id: 'MINE' },
        'Cart',
      ],
    }),
  }),
});
export const { useCreatePaymentMutation, useVerifyPaymentMutation } = paymentApi;
