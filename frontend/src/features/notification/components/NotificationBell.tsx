import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationDropdown } from './NotificationDropdown'
import { useListNotificationsQuery } from '../notificationApi'
import { useState, useEffect } from 'react'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const { data, refetch } = useListNotificationsQuery({ page: 0, size: 5 })

  // Calculate unread count
  const unreadCount = data?.data?.content?.filter((n) => !n.read).length || 0

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
