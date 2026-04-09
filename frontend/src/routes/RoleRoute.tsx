import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/app/store'
import type { UserRole } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

/**
 * Renders <Outlet> only if the current user's role is in allowedRoles.
 * Redirects to /403 otherwise.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const currentUser = useAppSelector((s) => s.auth.currentUser)

  if (!currentUser || !allowedRoles.includes(currentUser.role as UserRole)) {
    return <Navigate to={ROUTE_PATHS.UNAUTHORIZED} replace />
  }

  return <Outlet />
}
