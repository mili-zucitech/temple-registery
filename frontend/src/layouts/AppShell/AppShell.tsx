import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar/Sidebar'
import { TopBar } from './TopBar/TopBar'

const PAGE_TITLES: Record<string, string> = {
  '/dc/dashboard': 'Dashboard',
  '/dc/temples': 'Temple Search',
  '/dc/declarations': 'Declarations',
  '/dc/export': 'Export Reports',
  '/ta/dashboard': 'Dashboard',
  '/ta/temple': 'Temple Profile',
  '/ta/trust': 'Trust & Board',
  '/ta/employees': 'Employees',
  '/ta/contractors': 'Contractors',
  '/ta/declarations': 'Declarations',
  '/ta/documents': 'Documents',
  '/ta/profile-status': 'Profile Status',
  '/ta/activity': 'Activity',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/users': 'User Management',
  '/admin/audit': 'Audit Logs',
  '/admin/geo': 'Geo Master',
  '/auditor/dashboard': 'Dashboard',
  '/auditor/temples': 'Temples',
  '/auditor/declarations': 'Declarations',
}

export function AppShell() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Temple Registry'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
