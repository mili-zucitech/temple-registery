import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/app/store'
import { useListNotificationsQuery } from '@/features/notification/notificationApi'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const { data } = useListNotificationsQuery({ size: 1 })
  const unreadCount = data?.data?.totalElements ?? 0

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Avatar */}
        {currentUser && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {currentUser.fullName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  )
}
