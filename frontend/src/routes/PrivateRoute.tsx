import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/store'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { setCurrentUser } from '@/features/auth/authSlice'
import { useAppDispatch } from '@/app/store'
import { ROUTE_PATHS } from '@/constants/routePaths'

/**
 * Redirects unauthenticated users to /login.
 * Calls GET /auth/me on mount to hydrate the Redux auth slice from the httpOnly cookie.
 */
export function PrivateRoute() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const { data, isLoading } = useGetCurrentUserQuery()

  if (data?.data) {
    dispatch(setCurrentUser(data.data))
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated && !data?.data) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />
  }

  return <Outlet />
}
