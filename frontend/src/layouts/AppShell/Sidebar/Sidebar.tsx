import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Search, FileText, Users, Building2,
  ClipboardList, Download, Settings, LogOut, Shield, Clock, Activity, RefreshCw
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
    { label: 'Audit Logs', to: ROUTE_PATHS.ADMIN_AUDIT, icon: <Shield size={16} /> },
    { label: 'Geo Master', to: ROUTE_PATHS.ADMIN_GEO, icon: <Settings size={16} /> },
    { label: 'Admin Tools', to: ROUTE_PATHS.ADMIN_TOOLS, icon: <RefreshCw size={16} /> },
  ]
}

function getAuditorNavItems(): NavItem[] {
  return [
    { label: 'Dashboard', to: ROUTE_PATHS.AUDITOR_DASHBOARD, icon: <LayoutDashboard size={16} /> },
    { label: 'Temples', to: ROUTE_PATHS.AUDITOR_TEMPLES, icon: <Building2 size={16} /> },
    { label: 'Declarations', to: ROUTE_PATHS.AUDITOR_DECLARATIONS, icon: <ClipboardList size={16} /> },
  ]
}

import { useEffect } from 'react'

interface SidebarProps {
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  const { handleLogout } = useLogout()
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const role = currentUser?.role

  let navItems: NavItem[] = []
  if (role === USER_ROLES.DISTRICT_COLLECTOR || role === USER_ROLES.DC_STAFF) navItems = getDcNavItems()
  else if (role === USER_ROLES.TEMPLE_AUTHORITY) navItems = getTaNavItems()
  else if (role === USER_ROLES.SUPER_ADMIN) navItems = getAdminNavItems()
  else if (role === USER_ROLES.AUDITOR) navItems = getAuditorNavItems()

  // Prevent body scroll when sidebar drawer is open on mobile
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <aside
      className={cn(
        // Mobile: off-canvas
        'fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ease-in-out',
        'lg:static lg:translate-x-0 shadow-soft-lg lg:shadow-none',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      aria-label="Sidebar"
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border/50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-gold shadow-gold group cursor-pointer hover:rotate-12 transition-transform">
          <span className="text-sm font-bold text-white tracking-tighter">TR</span>
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-display font-bold text-sidebar-foreground leading-none tracking-tight">Temple Registry</p>
          <p className="text-[10px] text-sidebar-foreground/50 font-medium leading-none mt-1 uppercase tracking-wider">Karnataka HR&CE</p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-white font-semibold shadow-soft-md shadow-sidebar-primary/20 translate-x-1'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1',
              )
            }
            onClick={() => setOpen?.(false)}
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "transition-transform group-hover:scale-110 duration-200",
                  "flex items-center justify-center w-5 h-5"
                )}>
                  {item.icon}
                </div>
                <span className="font-medium tracking-tight">{item.label}</span>
                {/* Active indicator dot */}
                <div className={cn(
                  "ml-auto h-1.5 w-1.5 rounded-full bg-white transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-0"
                )} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Actions Section */}
      <div className="mt-auto border-t border-sidebar-border/50 p-4 bg-sidebar-accent/30">
        {/* {currentUser && (
          <div className="mb-4 px-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary font-bold text-xs ring-2 ring-sidebar-primary/10">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate tracking-tight">{currentUser.fullName}</p>
              <p className="text-[10px] text-sidebar-foreground/40 font-medium truncate uppercase tracking-tighter mt-0.5">{currentUser.role.replace(/_/g, ' ')}</p>
            </div>
          </div>
        )} */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 rounded-xl text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive px-3 py-5 transition-all group"
          onClick={handleLogout}
        >
          <LogOut size={16} className="transition-transform group-hover:-translate-x-1" />
          <span className="font-semibold text-xs uppercase tracking-widest">Sign Out</span>
        </Button>
      </div>
    </aside>
  )
}
