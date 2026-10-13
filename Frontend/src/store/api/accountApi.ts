import { baseApi } from './baseApi';
import { clearSession } from '@/store/slices/authSlice';
import { resetCheckout } from '@/store/slices/checkoutSlice';
import { closeCart } from '@/store/slices/cartSlice';
import type {
  AccountPreferences,
  AddressInput,
  CustomerDashboard,
  CustomerOrder,
  CustomerProfile,
  CustomerReturn,
  SavedAddress,
  SavedCollection,
  SavedUpi,
  UpiInput,
} from '@/types/account';
import type { PageParams, PageResult } from '@/types/common';

export const accountApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAccountDashboard: build.query<CustomerDashboard, void>({
      query: () => 'account',
      providesTags: ['Account', 'User', 'Wishlist', 'OrderList', 'Return'],
    }),
    getAccountProfile: build.query<CustomerProfile, void>({
      query: () => 'account/profile',
      providesTags: ['User'],
    }),
    saveAccountProfile: build.mutation<CustomerProfile, { name: string; phone: string }>({
      query: (body) => ({ url: 'account/profile', method: 'PATCH', body }),
      invalidatesTags: ['User', 'Account'],
    }),
    getAccountAddresses: build.query<SavedCollection<SavedAddress>, void>({
      query: () => 'account/addresses',
      providesTags: ['Address'],
    }),
    saveAccountAddress: build.mutation<
      SavedCollection<SavedAddress>,
      { id?: string; address: AddressInput }
    >({
      query: ({ id, address }) => ({
        url: id ? `account/addresses/${encodeURIComponent(id)}` : 'account/addresses',
        method: id ? 'PATCH' : 'POST',
        body: address,
      }),
      invalidatesTags: ['Address', 'Account'],
    }),
    deleteAccountAddress: build.mutation<SavedCollection<SavedAddress>, string>({
      query: (id) => ({ url: `account/addresses/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['Address', 'Account'],
    }),
    setDefaultAddress: build.mutation<SavedCollection<SavedAddress>, string>({
      query: (id) => ({
        url: `account/addresses/${encodeURIComponent(id)}/default`,
        method: 'POST',
      }),
      invalidatesTags: ['Address'],
    }),
    getAccountPaymentMethods: build.query<SavedCollection<SavedUpi>, void>({
      query: () => 'account/payment-methods',
      providesTags: ['PaymentMethod'],
    }),
    saveAccountPaymentMethod: build.mutation<
      SavedCollection<SavedUpi>,
      { id?: string; method: UpiInput }
    >({
      query: ({ id, method }) => ({
        url: id ? `account/payment-methods/${encodeURIComponent(id)}` : 'account/payment-methods',
        method: id ? 'PATCH' : 'POST',
        body: method,
      }),
      invalidatesTags: ['PaymentMethod', 'Account'],
    }),
    deleteAccountPaymentMethod: build.mutation<SavedCollection<SavedUpi>, string>({
      query: (id) => ({
        url: `account/payment-methods/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMethod', 'Account'],
    }),
    setDefaultPaymentMethod: build.mutation<SavedCollection<SavedUpi>, string>({
      query: (id) => ({
        url: `account/payment-methods/${encodeURIComponent(id)}/default`,
        method: 'POST',
      }),
      invalidatesTags: ['PaymentMethod'],
    }),
    getAccountSettings: build.query<AccountPreferences, void>({
      query: () => 'account/settings',
      providesTags: ['AccountSettings'],
    }),
    saveAccountSettings: build.mutation<AccountPreferences, AccountPreferences>({
      query: (body) => ({ url: 'account/settings', method: 'PATCH', body }),
      invalidatesTags: ['AccountSettings'],
    }),
    getCustomerOrders: build.query<PageResult<CustomerOrder>, PageParams>({
      query: (params) => ({ url: 'account/orders', params }),
      providesTags: ['OrderList', 'Order'],
    }),
    getCustomerOrder: build.query<CustomerOrder, string>({
      query: (id) => `account/orders/${encodeURIComponent(id)}`,
      providesTags: ['Order', 'Return'],
    }),
    cancelCustomerOrder: build.mutation<CustomerOrder, string>({
      query: (id) => ({ url: `account/orders/${encodeURIComponent(id)}/cancel`, method: 'POST' }),
      invalidatesTags: ['Order', 'OrderList', 'Account'],
    }),
    requestCustomerReturn: build.mutation<CustomerReturn, { orderId: string; reason: string }>({
      query: ({ orderId, reason }) => ({
        url: `account/orders/${encodeURIComponent(orderId)}/returns`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Order', 'OrderList', 'Return', 'Account'],
    }),
    getCustomerReturns: build.query<PageResult<CustomerReturn>, PageParams>({
      query: (params) => ({ url: 'account/returns', params }),
      providesTags: ['Return'],
    }),
    changeAccountPassword: build.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({ url: 'account/password', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
          dispatch(clearSession());
          dispatch(resetCheckout());
          dispatch(closeCart());
        } catch {
          /* Show form errors. */
        }
      },
    }),
    revokeAccountSessions: build.mutation<void, { currentPassword: string }>({
      query: (body) => ({ url: 'account/sessions/revoke', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
          dispatch(clearSession());
          dispatch(resetCheckout());
          dispatch(closeCart());
        } catch {
          /* Show form errors. */
        }
      },
    }),
  }),
});
export const {
  useGetAccountDashboardQuery,
  useGetAccountProfileQuery,
  useSaveAccountProfileMutation,
  useGetAccountAddressesQuery,
  useSaveAccountAddressMutation,
  useDeleteAccountAddressMutation,
  useSetDefaultAddressMutation,
  useGetAccountPaymentMethodsQuery,
  useSaveAccountPaymentMethodMutation,
  useDeleteAccountPaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
  useGetAccountSettingsQuery,
  useSaveAccountSettingsMutation,
  useGetCustomerOrdersQuery,
  useGetCustomerOrderQuery,
  useCancelCustomerOrderMutation,
  useRequestCustomerReturnMutation,
  useGetCustomerReturnsQuery,
  useChangeAccountPasswordMutation,
  useRevokeAccountSessionsMutation,
} = accountApi;
