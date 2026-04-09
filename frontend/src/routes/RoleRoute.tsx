import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/store'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import type { UserRole } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

/**
 * Renders <Outlet> only if the current user's role is in allowedRoles.
 * Falls back to the RTK Query result when Redux state hasn't hydrated yet.
 * Redirects to /403 otherwise.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const { data } = useGetCurrentUserQuery()

  // Use Redux store if available, fall back to RTK Query data directly
  const role = currentUser?.role ?? (data?.data?.role as UserRole | undefined)

  if (!role) {
    // Auth hasn't resolved yet — PrivateRoute handles the loading state above us
    return null
  }

  if (!allowedRoles.includes(role as UserRole)) {
    return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} replace />
  }

  return <Outlet />
}
