import { baseApi } from './baseApi';
import { clearSession, setCsrfToken } from '@/store/slices/authSlice';
import { resetCheckout } from '@/store/slices/checkoutSlice';
import { closeCart } from '@/store/slices/cartSlice';
import type { AuthResponse, Credentials, Registration, SessionResponse, User } from '@/types/auth';
import type { ApiMessage } from '@/types/common';
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrentUser: build.query<SessionResponse, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
    }),
    login: build.mutation<AuthResponse, Credentials>({
      query: (body) => ({ url: 'auth/login', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
          dispatch(resetCheckout());
          dispatch(setCsrfToken(data.csrfToken));
          dispatch(authApi.util.upsertQueryData('getCurrentUser', undefined, { user: data.user }));
        } catch {
          /* The form displays the sanitized API error. */
        }
      },
    }),
    register: build.mutation<AuthResponse, Registration>({
      query: (body) => ({ url: 'auth/register', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
          dispatch(resetCheckout());
          dispatch(setCsrfToken(data.csrfToken));
          dispatch(authApi.util.upsertQueryData('getCurrentUser', undefined, { user: data.user }));
        } catch {
          /* Handled by the form. */
        }
      },
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: 'auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(baseApi.util.resetApiState());
          dispatch(clearSession());
          dispatch(closeCart());
          dispatch(resetCheckout());
        } catch {
          /* Preserve session state when logout fails. */
        }
      },
    }),
    // The current backend renews sessions through its rolling HttpOnly cookie.
    refreshSession: build.query<SessionResponse, void>({
      query: () => 'auth/me',
      providesTags: ['User'],
    }),
    forgotPassword: build.mutation<ApiMessage, { email: string }>({
      query: (body) => ({ url: 'auth/forgot-password', method: 'POST', body }),
    }),
    resetPassword: build.mutation<ApiMessage, { token: string; password: string }>({
      query: (body) => ({ url: 'auth/reset-password', method: 'POST', body }),
    }),
    updateProfile: build.mutation<User, { name: string }>({
      query: (body) => ({ url: 'users/me', method: 'PATCH', body }),
      invalidatesTags: ['User'],
    }),
  }),
});
export const {
  useGetCurrentUserQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdateProfileMutation,
} = authApi;
