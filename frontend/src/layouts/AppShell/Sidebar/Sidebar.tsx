import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, FileText, Users, Building2,
  ClipboardList, Download, Settings, LogOut, Shield, Clock, Activity,
} from 'lucide-react'
import { useLogout } from '@/features/auth/authHooks'
import { useAppSelector } from '@/app/store'
import { USER_ROLES } from '@/constants/roles'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

function getDcNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.DC_DASHBOARD, icon: <LayoutDashboard size={16} /> },
    { label: 'Temples', to: ROUTE_PATHS.DC_TEMPLES, icon: <Search size={16} /> },
    { label: 'Declarations', to: ROUTE_PATHS.DC_DECLARATIONS, icon: <ClipboardList size={16} /> },
    { label: 'Export', to: ROUTE_PATHS.DC_EXPORT, icon: <Download size={16} /> },
  ]
}

function getTaNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.TA_DASHBOARD, icon: <LayoutDashboard size={16} /> },
    { label: 'Temple Profile', to: ROUTE_PATHS.TA_TEMPLE, icon: <Building2 size={16} /> },
    { label: 'Trust & Board', to: ROUTE_PATHS.TA_TRUST, icon: <Shield size={16} /> },
    { label: 'Employees', to: ROUTE_PATHS.TA_EMPLOYEES, icon: <Users size={16} /> },
    { label: 'Contractors', to: ROUTE_PATHS.TA_CONTRACTORS, icon: <FileText size={16} /> },
    { label: 'Declarations', to: ROUTE_PATHS.TA_DECLARATIONS, icon: <ClipboardList size={16} /> },
    { label: 'Documents', to: ROUTE_PATHS.TA_DOCUMENTS, icon: <Download size={16} /> },
    { label: 'Profile Status', to: ROUTE_PATHS.TA_PROFILE_STATUS, icon: <Clock size={16} /> },
    { label: 'Activity', to: ROUTE_PATHS.TA_ACTIVITY, icon: <Activity size={16} /> },
  ]
}

function getAdminNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.ADMIN_DASHBOARD, icon: <LayoutDashboard size={16} /> },
    { label: 'Users', to: ROUTE_PATHS.ADMIN_USERS, icon: <Users size={16} /> },
    { label: 'Audit Logs', to: ROUTE_PATHS.ADMIN_AUDIT, icon: <ClipboardList size={16} /> },
    { label: 'Geo Master', to: ROUTE_PATHS.ADMIN_GEO, icon: <Settings size={16} /> },
  ]
}

function getAuditorNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.AUDITOR_DASHBOARD, icon: <LayoutDashboard size={16} /> },
    { label: 'Temples', to: ROUTE_PATHS.AUDITOR_TEMPLES, icon: <Building2 size={16} /> },
    { label: 'Declarations', to: ROUTE_PATHS.AUDITOR_DECLARATIONS, icon: <ClipboardList size={16} /> },
  ]
}

export function Sidebar() {
  const { handleLogout } = useLogout()
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const role = currentUser?.role

  let navItems: NavItem[] = []
  if (role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF) navItems = getDcNavItems()
  else if (role === USER_ROLES.TEMPLE_AUTHORITY) navItems = getTaNavItems()
  else if (role === USER_ROLES.SUPER_ADMIN) navItems = getAdminNavItems()
  else if (role === USER_ROLES.AUDITOR) navItems = getAuditorNavItems()

  return (
    <aside className="flex h-screen w-60 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-gold shadow-gold">
          <span className="text-xs font-bold text-white">TR</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-sidebar-foreground leading-none">Temple Registry</p>
          <p className="text-[10px] text-sidebar-foreground/60 leading-none mt-0.5">Karnataka HR&CE</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-white font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent',
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-sidebar-border p-3">
        {currentUser && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser.fullName}</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">{currentUser.role.replace(/_/g, ' ')}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut size={14} />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
