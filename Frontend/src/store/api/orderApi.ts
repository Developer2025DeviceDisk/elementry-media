import { baseApi } from './baseApi';
import type { CreateOrder } from '@/types/order';
import type { CustomerOrder, CustomerReturn } from '@/types/account';
import type { PageParams, PageResult } from '@/types/common';
export const orderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<PageResult<CustomerOrder>, PageParams>({
      query: (params) => ({ url: 'orders', params }),
      providesTags: (result) => [
        { type: 'OrderList', id: 'MINE' },
        ...(result?.data.map(({ id }) => ({ type: 'Order' as const, id })) ?? []),
      ],
    }),
    getOrderById: build.query<CustomerOrder, string>({
      query: (id) => `orders/${encodeURIComponent(id)}`,
      providesTags: (_, __, id) => [{ type: 'Order', id }],
    }),
    createOrder: build.mutation<CustomerOrder, CreateOrder>({
      query: ({ idempotencyKey, ...body }) => ({
        url: 'orders',
        method: 'POST',
        body: { ...body, idempotencyKey },
      }),
      invalidatesTags: [{ type: 'OrderList', id: 'MINE' }, 'Cart'],
    }),
    cancelOrder: build.mutation<CustomerOrder, string>({
      query: (id) => ({ url: `orders/${encodeURIComponent(id)}/cancel`, method: 'POST' }),
      invalidatesTags: (_, __, id) => [
        { type: 'Order', id },
        { type: 'OrderList', id: 'MINE' },
      ],
    }),
    requestReturn: build.mutation<CustomerReturn, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `orders/${encodeURIComponent(id)}/returns`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Order', id }],
    }),
  }),
});
export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useRequestReturnMutation,
} = orderApi;
