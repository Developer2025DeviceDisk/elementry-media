import { baseApi } from './baseApi';
import type { Product, ProductInput, Category, Review } from '@/types/product';
import type { Order, OrderStatus } from '@/types/order';
import type { User } from '@/types/auth';
import type { Coupon } from './couponApi';
import type { PageParams, PageResult } from '@/types/common';
export interface Dashboard {
  revenue: string;
  currency: string;
  orders: number;
  customers: number;
  lowStock: number;
}
export interface AnalyticsPoint {
  date: string;
  revenue: number;
  orders: number;
}
export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboard: build.query<Dashboard, void>({
      query: () => 'admin/dashboard',
      providesTags: ['Dashboard'],
    }),
    getAdminProducts: build.query<PageResult<Product>, PageParams & { q?: string }>({
      query: (params) => ({ url: 'admin/products', params }),
      providesTags: [{ type: 'ProductList', id: 'ADMIN' }],
    }),
    createProduct: build.mutation<Product, ProductInput>({
      query: (body) => ({ url: 'admin/products', method: 'POST', body }),
      invalidatesTags: ['ProductList', 'Inventory', 'Dashboard'],
    }),
    updateProduct: build.mutation<Product, { id: string; data: Partial<ProductInput> }>({
      query: ({ id, data }) => ({
        url: `admin/products/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_, __, { id }) => [{ type: 'Product', id }, 'ProductList', 'Inventory'],
    }),
    deleteProduct: build.mutation<void, string>({
      query: (id) => ({ url: `admin/products/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: (_, __, id) => [
        { type: 'Product', id },
        'ProductList',
        'Inventory',
        'Dashboard',
      ],
    }),
    getAdminOrders: build.query<PageResult<Order>, PageParams & { status?: string }>({
      query: (params) => ({ url: 'admin/orders', params }),
      providesTags: [{ type: 'OrderList', id: 'ADMIN' }],
    }),
    updateOrderStatus: build.mutation<Order, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({
        url: `admin/orders/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Order', id },
        'OrderList',
        'Dashboard',
        'Analytics',
      ],
    }),
    updateInventory: build.mutation<Product, { id: string; stock: number }>({
      query: ({ id, stock }) => ({
        url: `admin/inventory/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: { stock },
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Product', id },
        'ProductList',
        'Inventory',
        'Dashboard',
      ],
    }),
    getAdminCategories: build.query<Category[], void>({
      query: () => 'admin/categories',
      providesTags: ['Category'],
    }),
    createCategory: build.mutation<Category, { name: string; slug: string }>({
      query: (body) => ({ url: 'admin/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    getCustomers: build.query<PageResult<User>, PageParams>({
      query: (params) => ({ url: 'admin/customers', params }),
      providesTags: ['Customer'],
    }),
    getCoupons: build.query<Coupon[], void>({
      query: () => 'admin/coupons',
      providesTags: ['Coupon'],
    }),
    createCoupon: build.mutation<Coupon, Omit<Coupon, 'id'>>({
      query: (body) => ({ url: 'admin/coupons', method: 'POST', body }),
      invalidatesTags: ['Coupon'],
    }),
    getAdminReviews: build.query<PageResult<Review>, PageParams>({
      query: (params) => ({ url: 'admin/reviews', params }),
      providesTags: ['Review'],
    }),
    moderateReview: build.mutation<void, string>({
      query: (id) => ({ url: `admin/reviews/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['Review', 'ProductList'],
    }),
    getAnalytics: build.query<AnalyticsPoint[], void>({
      query: () => 'admin/analytics',
      providesTags: ['Analytics'],
    }),
  }),
});
export const {
  useGetDashboardQuery,
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useUpdateInventoryMutation,
  useGetAdminCategoriesQuery,
  useCreateCategoryMutation,
  useGetCustomersQuery,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useGetAdminReviewsQuery,
  useModerateReviewMutation,
  useGetAnalyticsQuery,
} = adminApi;
