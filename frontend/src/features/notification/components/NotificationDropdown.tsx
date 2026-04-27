import { useListNotificationsQuery, useMarkAllReadMutation } from '../notificationApi'
import { NotificationCard } from './NotificationCard'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

interface NotificationDropdownProps {
  onClose: () => void
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { data, isLoading } = useListNotificationsQuery({ page: 0, size: 5 })
  const [markAllRead, { isLoading: isMarkingAllRead }] = useMarkAllReadMutation()

  const notifications = data?.data?.content || []
  const hasUnread = notifications.some((n) => !n.read)

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold text-lg">Notifications</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAllRead}
          >
            {isMarkingAllRead ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Mark all read'
            )}
          </Button>
        )}
      </div>

      <Separator />

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                compact
                onClick={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link to="/notifications" onClick={onClose}>
              <Button variant="ghost" className="w-full">
                View all notifications
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
