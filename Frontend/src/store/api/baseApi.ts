import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { env } from '@/config/env';
import { setCsrfToken, sessionExpired } from '@/store/slices/authSlice';

interface TransportState {
  auth: { csrfToken: string | null };
}
const rawQuery = fetchBaseQuery({
  baseUrl: env.apiUrl ? `${env.apiUrl.replace(/\/$/, '')}/` : undefined,
  credentials: 'include',
  timeout: 15000,
  prepareHeaders(headers, { getState }) {
    headers.set('Accept', 'application/json');
    const csrf = (getState() as TransportState).auth.csrfToken;
    if (csrf) headers.set('X-CSRF-Token', csrf);
    return headers;
  },
});
// Single-flight per store prevents parallel writes creating competing anonymous sessions.
const csrfRequests = new WeakMap<object, Promise<string | FetchBaseQueryError>>();
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  options,
) => {
  // A frontend-only deployment can render while its backend URL is being configured.
  // Never send account requests to an invented host or the frontend's own routes.
  if (!env.apiUrl) {
    return { error: { status: 'FETCH_ERROR', error: 'Backend API is not configured' } };
  }
  const method = typeof args === 'string' ? 'GET' : (args.method ?? 'GET').toUpperCase();
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(method) &&
    !(api.getState() as TransportState).auth.csrfToken
  ) {
    let pending = csrfRequests.get(api.dispatch);
    if (!pending) {
      pending = (async (): Promise<string | FetchBaseQueryError> => {
        const csrf = await rawQuery('auth/csrf', api, options);
        if (csrf.error) return csrf.error;
        if (
          !csrf.data ||
          typeof csrf.data !== 'object' ||
          !('csrfToken' in csrf.data) ||
          typeof csrf.data.csrfToken !== 'string'
        )
          return { status: 'CUSTOM_ERROR', error: 'Invalid session response' };
        return csrf.data.csrfToken;
      })();
      csrfRequests.set(api.dispatch, pending);
    }
    const csrf = await pending;
    csrfRequests.delete(api.dispatch);
    if (typeof csrf !== 'string') return { error: csrf };
    api.dispatch(setCsrfToken(csrf));
  }
  const result = await rawQuery(args, api, options);
  if (result.error?.status === 401) {
    // This backend uses rolling sessions, not bearer/refresh tokens. Never replay mutations.
    api.dispatch(sessionExpired());
  }
  return result;
};
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Product',
    'ProductList',
    'Category',
    'Cart',
    'Wishlist',
    'Order',
    'OrderList',
    'User',
    'Review',
    'Coupon',
    'Dashboard',
    'Customer',
    'Inventory',
    'Analytics',
    'Account',
    'Address',
    'PaymentMethod',
    'AccountSettings',
    'Return',
  ],
  keepUnusedDataFor: 60,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: () => ({}),
});
