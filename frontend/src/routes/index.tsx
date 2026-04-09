import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary/ErrorBoundary'
import { PrivateRoute } from './PrivateRoute'
import { RoleRoute } from './RoleRoute'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage       = lazy(() => import('@/features/auth/pages/LoginPage/LoginPage').then(m => ({ default: m.LoginPage })))
const MfaVerifyPage   = lazy(() => import('@/features/auth/pages/MfaVerifyPage/MfaVerifyPage').then(m => ({ default: m.MfaVerifyPage })))
const DcDashboardPage = lazy(() => import('@/features/dashboard/pages/DcDashboardPage/DcDashboardPage').then(m => ({ default: m.DcDashboardPage })))
const TempleListPage  = lazy(() => import('@/features/temple/pages/TempleListPage/TempleListPage').then(m => ({ default: m.TempleListPage })))
const TempleDetailPage = lazy(() => import('@/features/temple/pages/TempleDetailPage/TempleDetailPage').then(m => ({ default: m.TempleDetailPage })))
const DcDeclarationListPage = lazy(() => import('@/features/declaration/pages/DeclarationListPage/DeclarationListPage').then(m => ({ default: m.DeclarationListPage })))
const DcDeclarationReviewPage = lazy(() => import('@/features/declaration/pages/DeclarationReviewPage/DeclarationReviewPage').then(m => ({ default: m.DeclarationReviewPage })))
const TaDeclarationListPage = lazy(() => import('@/features/declaration/pages/DeclarationListPage/DeclarationListPage').then(m => ({ default: m.DeclarationListPage })))
const TaDeclarationCreatePage = lazy(() => import('@/features/declaration/pages/DeclarationCreatePage/DeclarationCreatePage').then(m => ({ default: m.DeclarationCreatePage })))
const TaDashboardPage = lazy(() => import('@/features/dashboard/pages/TaDashboardPage/TaDashboardPage').then(m => ({ default: m.TaDashboardPage })))
const AdminDashboardPage = lazy(() => import('@/features/dashboard/pages/AdminDashboardPage/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const UserManagementPage = lazy(() => import('@/features/admin/pages/UserManagementPage/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const AuditLogPage = lazy(() => import('@/features/admin/pages/AuditLogPage/AuditLogPage').then(m => ({ default: m.AuditLogPage })))

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────
  { path: ROUTE_PATHS.LOGIN, element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
  { path: ROUTE_PATHS.MFA_VERIFY, element: <Suspense fallback={<PageLoader />}><MfaVerifyPage /></Suspense> },
  { path: ROUTE_PATHS.UNAUTHORIZED, element: <div className="flex min-h-screen items-center justify-center"><h1 className="text-2xl font-bold text-destructive">403 — Access Denied</h1></div> },

  // ── Protected routes ──────────────────────────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          // DC / DC Staff
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.DISTRICT_COLLECTOR, USER_ROLES.DC_STAFF]} />,
            children: [
              { path: ROUTE_PATHS.DC_DASHBOARD, element: <Suspense fallback={<PageLoader />}><DcDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.DC_TEMPLES, element: <Suspense fallback={<PageLoader />}><TempleListPage /></Suspense> },
              { path: ROUTE_PATHS.DC_TEMPLE_DETAIL, element: <Suspense fallback={<PageLoader />}><TempleDetailPage /></Suspense> },
              { path: ROUTE_PATHS.DC_DECLARATIONS, element: <Suspense fallback={<PageLoader />}><DcDeclarationListPage /></Suspense> },
              { path: ROUTE_PATHS.DC_DECLARATION_DETAIL, element: <Suspense fallback={<PageLoader />}><DcDeclarationReviewPage /></Suspense> },
            ],
          },
          // Temple Authority
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.TEMPLE_AUTHORITY]} />,
            children: [
              { path: ROUTE_PATHS.TA_DASHBOARD, element: <Suspense fallback={<PageLoader />}><TaDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.TA_DECLARATIONS, element: <Suspense fallback={<PageLoader />}><TaDeclarationListPage /></Suspense> },
              { path: ROUTE_PATHS.TA_DECLARATION_NEW, element: <Suspense fallback={<PageLoader />}><TaDeclarationCreatePage /></Suspense> },
            ],
          },
          // Super Admin
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]} />,
            children: [
              { path: ROUTE_PATHS.ADMIN_DASHBOARD, element: <Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_USERS, element: <Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_AUDIT, element: <Suspense fallback={<PageLoader />}><AuditLogPage /></Suspense> },
            ],
          },
        ],
      },
    ],
  },

  // ── Catch-all redirect ────────────────────────────────────────────────────
  { path: '/', element: <Navigate to={ROUTE_PATHS.LOGIN} replace /> },
  { path: '*', element: <Navigate to={ROUTE_PATHS.LOGIN} replace /> },
])

export function AppRouter() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
