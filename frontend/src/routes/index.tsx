import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary/ErrorBoundary'
import { PrivateRoute } from './PrivateRoute'
import { RoleRoute } from './RoleRoute'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { TaTemplePage } from '@/features/temple-profile/pages/TaTemplePage/TaTemplePage'
import { TaTempleEditPage } from '@/features/temple-profile/pages/TaTempleEditPage/TaTempleEditPage'
import { TaTempleReviewPage } from '@/features/temple-profile/pages/TaTempleReviewPage/TaTempleReviewPage'

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LoginPage       = lazy(() => import('@/features/auth/pages/LoginPage/LoginPage').then(m => ({ default: m.LoginPage })))
const MfaVerifyPage   = lazy(() => import('@/features/auth/pages/MfaVerifyPage/MfaVerifyPage').then(m => ({ default: m.MfaVerifyPage })))
const RegisterWizardPage = lazy(() => import('@/features/auth/register/RegisterWizard').then(m => ({ default: m.RegisterWizard })))
const DcDashboardPage = lazy(() => import('@/features/dc/pages/DcDashboardPage/DcDashboardPage').then(m => ({ default: m.DcModuleDashboardPage })))
const DcTempleSearchPage = lazy(() => import('@/features/dc/pages/DcTempleSearchPage/DcTempleSearchPage').then(m => ({ default: m.DcTempleSearchPage })))
const DcTempleProfilePage = lazy(() => import('@/features/dc/pages/DcTempleProfilePage/DcTempleProfilePage').then(m => ({ default: m.DcTempleProfilePage })))
const DcDeclarationListPage = lazy(() => import('@/features/declaration/pages/DeclarationListPage/DeclarationListPage').then(m => ({ default: m.DeclarationListPage })))
const DcDeclarationDetailPage = lazy(() => import('@/features/dc/pages/DcDeclarationDetailPage/DcDeclarationDetailPage').then(m => ({ default: m.DcDeclarationDetailPage })))
const DcExportPage = lazy(() => import('@/features/dc/pages/DcExportPage/DcExportPage').then(m => ({ default: m.DcExportPage })))
const TaDeclarationListPage = lazy(() => import('@/features/declaration/pages/DeclarationListPage/DeclarationListPage').then(m => ({ default: m.DeclarationListPage })))
const TaDeclarationCreatePage = lazy(() => import('@/features/declaration/pages/DeclarationCreatePage/DeclarationCreatePage').then(m => ({ default: m.DeclarationCreatePage })))
const TaDashboardPage = lazy(() => import('@/features/dashboard/pages/TaDashboardPage/TaDashboardPage').then(m => ({ default: m.TaDashboardPage })))
const AdminDashboardPage = lazy(() => import('@/features/dashboard/pages/AdminDashboardPage/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const UserManagementPage = lazy(() => import('@/features/admin/pages/UserManagementPage/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const AuditLogPage = lazy(() => import('@/features/admin/pages/AuditLogPage/AuditLogPage').then(m => ({ default: m.AuditLogPage })))
const AdminToolsPage = lazy(() => import('@/features/admin/pages/AdminToolsPage/AdminToolsPage').then(m => ({ default: m.AdminToolsPage })))
const GeoManagementPage = lazy(() => import('@/features/admin/pages/GeoManagementPage/GeoManagementPage').then(m => ({ default: m.GeoManagementPage })))
const TaTrustPage = lazy(() => import('@/features/trust/pages/TaTrustPage/TaTrustPage').then(m => ({ default: m.TaTrustPage })))
const TaEmployeesPage = lazy(() => import('@/features/employee/pages/TaEmployeesPage/TaEmployeesPage').then(m => ({ default: m.TaEmployeesPage })))
const EmployeeDetailPage = lazy(() => import('@/features/employee/pages/EmployeeDetailPage/EmployeeDetailPage').then(m => ({ default: m.EmployeeDetailPage })))
const TaContractorsPage = lazy(() => import('@/features/contractor/pages/TaContractorsPage/TaContractorsPage').then(m => ({ default: m.TaContractorsPage })))
const ContractorFormPage = lazy(() => import('@/features/contractor/pages/ContractorFormPage/ContractorFormPage').then(m => ({ default: m.ContractorFormPage })))
const ContractorDetailPage = lazy(() => import('@/features/contractor/pages/ContractorDetailPage/ContractorDetailPage').then(m => ({ default: m.ContractorDetailPage })))
const TaDocumentsPage = lazy(() => import('@/features/document/pages/TaDocumentsPage/TaDocumentsPage').then(m => ({ default: m.TaDocumentsPage })))
const TaDeclarationDetailPage = lazy(() => import('@/features/declaration/pages/TaDeclarationDetailPage/TaDeclarationDetailPage').then(m => ({ default: m.TaDeclarationDetailPage })))
const TaProfileStatusPage = lazy(() => import('@/features/dashboard/pages/TaProfileStatusPage/TaProfileStatusPage').then(m => ({ default: m.TaProfileStatusPage })))
const TaActivityPage = lazy(() => import('@/features/dashboard/pages/TaActivityPage/TaActivityPage').then(m => ({ default: m.TaActivityPage })))
const NotificationInboxPage = lazy(() => import('@/features/notification/pages/NotificationInboxPage').then(m => ({ default: m.NotificationInboxPage })))
const NotificationPreferencesPage = lazy(() => import('@/features/notification/pages/NotificationPreferencesPage').then(m => ({ default: m.NotificationPreferencesPage })))

const PageLoader = () => (
  <div className="flex h-64 items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
)

const router = createBrowserRouter([
  // ── Public routes ─────────────────────────────────────────────────────────
  { path: ROUTE_PATHS.LOGIN, element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense> },
  { path: ROUTE_PATHS.MFA_VERIFY, element: <Suspense fallback={<PageLoader />}><MfaVerifyPage /></Suspense> },
  { path: ROUTE_PATHS.REGISTER, element: <Suspense fallback={<PageLoader />}><RegisterWizardPage /></Suspense> },
  { path: ROUTE_PATHS.UNAUTHORIZED, element: <div className="flex min-h-screen items-center justify-center"><h1 className="text-2xl font-bold text-destructive">403 — Access Denied</h1></div> },

  // ── Protected routes ──────────────────────────────────────────────────────
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          // DC / DC Staff / Super Admin
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.DISTRICT_COLLECTOR, USER_ROLES.DC_STAFF, USER_ROLES.SUPER_ADMIN]} />,
            children: [
              { path: ROUTE_PATHS.DC_DASHBOARD, element: <Suspense fallback={<PageLoader />}><DcDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.DC_TEMPLES, element: <Suspense fallback={<PageLoader />}><DcTempleSearchPage /></Suspense> },
              { path: ROUTE_PATHS.DC_TEMPLE_DETAIL, element: <Suspense fallback={<PageLoader />}><DcTempleProfilePage /></Suspense> },
              { path: ROUTE_PATHS.DC_DECLARATIONS, element: <Suspense fallback={<PageLoader />}><DcDeclarationListPage /></Suspense> },
              { path: ROUTE_PATHS.DC_DECLARATION_DETAIL, element: <Suspense fallback={<PageLoader />}><DcDeclarationDetailPage /></Suspense> },
              { path: ROUTE_PATHS.DC_EXPORT, element: <Suspense fallback={<PageLoader />}><DcExportPage /></Suspense> },
            ],
          },
          // Temple Authority
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.TEMPLE_AUTHORITY]} />,
            children: [
              { path: ROUTE_PATHS.TA_DASHBOARD, element: <Suspense fallback={<PageLoader />}><TaDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.TA_TEMPLE, element: <Suspense fallback={<PageLoader />}><TaTemplePage /></Suspense> },
              { path: ROUTE_PATHS.TA_TEMPLE_EDIT, element: <Suspense fallback={<PageLoader />}><TaTempleEditPage /></Suspense> },
              { path: ROUTE_PATHS.TA_TEMPLE_REVIEW, element: <Suspense fallback={<PageLoader />}><TaTempleReviewPage /></Suspense> },
              { path: ROUTE_PATHS.TA_TRUST, element: <Suspense fallback={<PageLoader />}><TaTrustPage /></Suspense> },
              { path: ROUTE_PATHS.TA_EMPLOYEES, element: <Suspense fallback={<PageLoader />}><TaEmployeesPage /></Suspense> },
              { path: ROUTE_PATHS.TA_EMPLOYEE_DETAIL, element: <Suspense fallback={<PageLoader />}><EmployeeDetailPage /></Suspense> },
              { path: ROUTE_PATHS.TA_CONTRACTORS, element: <Suspense fallback={<PageLoader />}><TaContractorsPage /></Suspense> },
              { path: ROUTE_PATHS.TA_CONTRACTOR_NEW, element: <Suspense fallback={<PageLoader />}><ContractorFormPage /></Suspense> },
              { path: ROUTE_PATHS.TA_CONTRACTOR_EDIT, element: <Suspense fallback={<PageLoader />}><ContractorFormPage /></Suspense> },
              { path: ROUTE_PATHS.TA_CONTRACTOR_DETAIL, element: <Suspense fallback={<PageLoader />}><ContractorDetailPage /></Suspense> },
              { path: ROUTE_PATHS.TA_DOCUMENTS, element: <Suspense fallback={<PageLoader />}><TaDocumentsPage /></Suspense> },
              { path: ROUTE_PATHS.TA_DECLARATIONS, element: <Suspense fallback={<PageLoader />}><TaDeclarationListPage /></Suspense> },
              { path: ROUTE_PATHS.TA_DECLARATION_NEW, element: <Suspense fallback={<PageLoader />}><TaDeclarationCreatePage /></Suspense> },
              { path: ROUTE_PATHS.TA_DECLARATION_DETAIL, element: <Suspense fallback={<PageLoader />}><TaDeclarationDetailPage /></Suspense> },
              { path: ROUTE_PATHS.TA_PROFILE_STATUS, element: <Suspense fallback={<PageLoader />}><TaProfileStatusPage /></Suspense> },
              { path: ROUTE_PATHS.TA_ACTIVITY, element: <Suspense fallback={<PageLoader />}><TaActivityPage /></Suspense> },
            ],
          },
          // Super Admin
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.SUPER_ADMIN]} />,
            children: [
              { path: ROUTE_PATHS.ADMIN_DASHBOARD, element: <Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_USERS, element: <Suspense fallback={<PageLoader />}><UserManagementPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_AUDIT, element: <Suspense fallback={<PageLoader />}><AuditLogPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_GEO, element: <Suspense fallback={<PageLoader />}><GeoManagementPage /></Suspense> },
              { path: ROUTE_PATHS.ADMIN_TOOLS, element: <Suspense fallback={<PageLoader />}><AdminToolsPage /></Suspense> },
            ],
          },
          // Auditor (read-only)
          {
            element: <RoleRoute allowedRoles={[USER_ROLES.AUDITOR]} />,
            children: [
              { path: ROUTE_PATHS.AUDITOR_DASHBOARD, element: <Suspense fallback={<PageLoader />}><DcDashboardPage /></Suspense> },
              { path: ROUTE_PATHS.AUDITOR_TEMPLES, element: <Suspense fallback={<PageLoader />}><DcTempleSearchPage /></Suspense> },
              { path: ROUTE_PATHS.AUDITOR_TEMPLE_DETAIL, element: <Suspense fallback={<PageLoader />}><DcTempleProfilePage /></Suspense> },
              { path: ROUTE_PATHS.AUDITOR_DECLARATIONS, element: <Suspense fallback={<PageLoader />}><DcDeclarationListPage /></Suspense> },
              { path: ROUTE_PATHS.AUDITOR_DECLARATION_DETAIL, element: <Suspense fallback={<PageLoader />}><DcDeclarationDetailPage /></Suspense> },
            ],
          },
          // Notifications (all authenticated users)
          {
            children: [
              { path: ROUTE_PATHS.NOTIFICATIONS, element: <Suspense fallback={<PageLoader />}><NotificationInboxPage /></Suspense> },
              { path: ROUTE_PATHS.NOTIFICATION_PREFERENCES, element: <Suspense fallback={<PageLoader />}><NotificationPreferencesPage /></Suspense> },
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
