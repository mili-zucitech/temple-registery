import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/store'
import { useListNotificationsQuery } from '@/features/notification/notificationApi'

interface TopBarProps {
  title?: string
  onMenuClick?: () => void
}

export function TopBar({ title, onMenuClick }: TopBarProps) {
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const { data } = useListNotificationsQuery({ size: 1 })
  const unreadCount = data?.data?.totalElements ?? 0
  
  // Don't show redundant title for dashboard
  const displayTitle = title === 'Dashboard' ? '' : title

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/60 backdrop-blur-xl px-4 sm:px-6">
      {/* Hamburger for mobile/tablet */}
      <div className="flex items-center gap-2">
        <button
          className="lg:hidden mr-2 rounded-md p-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          aria-label="Open sidebar"
          onClick={onMenuClick}
        >
          <Menu size={22} />
        </button>
        {displayTitle && (
          <h1 className="text-lg font-semibold text-foreground truncate max-w-[180px] sm:max-w-none animate-in fade-in slide-in-from-left-2 duration-300">
            {displayTitle}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-colors">
          <Bell size={18} className="text-muted-foreground hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in duration-300">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* User profile / Avatar */}
        {currentUser && (
          <div className="flex items-center gap-3 pl-2 border-l border-border ml-1">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-foreground leading-none">{currentUser.fullName}</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-1">{currentUser.role.replace(/_/g, ' ')}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold shadow-gold text-xs font-bold text-white cursor-pointer hover:scale-105 transition-transform">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
