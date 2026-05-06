import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { clearCurrentUser } from '../features/auth/authSlice'
import { getApiV1BaseUrl } from '@/lib/apiBase'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: getApiV1BaseUrl(),
  credentials: 'include',
  // No Authorization header: JWT is stored exclusively in an httpOnly cookie.
  // credentials: 'include' sends the cookie automatically on every request.
  // Storing or reading the token from Redux state is intentionally prohibited.
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
    // Don't attempt refresh if this IS the refresh call, the initial /auth/me probe,
    // or the MFA verify step (user has no full JWT yet — only a tempToken)
    const url = typeof args === 'string' ? args : args.url
    if (url.includes('/auth/refresh') || url.includes('/auth/me') || url.includes('/auth/mfa-verify')) {
      return result
    }

    // Attempt silent token refresh — refresh token is sent automatically via httpOnly cookie
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      // Refresh succeeded — server has issued a new httpOnly cookie.
      // No token is dispatched to Redux: cookie is sent automatically on retry.
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      // Refresh failed — clear state and redirect to login
      api.dispatch(clearCurrentUser())
      window.location.href = '/login'
    }
  }

  return result
}
