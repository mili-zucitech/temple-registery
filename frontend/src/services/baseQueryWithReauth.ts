import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { setAccessToken, clearCurrentUser } from '@/features/auth/authSlice'

// Inline type to avoid store → authApi → baseQueryWithReauth → store circular dep
type StateWithAuth = { auth: { accessToken: string | null } }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as StateWithAuth).auth.accessToken
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return headers
  },
})

/**
 * RTK Query base query with automatic token refresh.
 * On 401: calls /auth/refresh (refresh token sent via httpOnly cookie) → retries original request once.
 * On second 401: clears auth state and redirects to /login.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Attempt silent token refresh — refresh token is sent automatically via httpOnly cookie
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      const newToken = (refreshResult.data as { data?: { accessToken?: string } }).data?.accessToken
      if (newToken) {
        api.dispatch(setAccessToken(newToken))
      }
      // Retry original request — prepareHeaders will now pick up the new token
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      // Refresh failed — clear state and redirect to login
      api.dispatch(clearCurrentUser())
      window.location.href = '/login'
    }
  }

  return result
}
