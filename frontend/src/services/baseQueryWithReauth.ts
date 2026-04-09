import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
})

/**
 * RTK Query base query with automatic token refresh.
 * On 401: calls /auth/refresh → retries original request once.
 * On second 401: redirects to /login.
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    // Attempt silent token refresh
    const refreshResult = await rawBaseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    )

    if (refreshResult.data) {
      // Retry original request with new cookie
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      // Refresh failed — redirect to login
      window.location.href = '/login'
    }
  }

  return result
}
