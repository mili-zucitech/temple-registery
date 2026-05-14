import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton'
import { Button } from '@/components/ui/button'
import type { NotificationResponse } from '@/features/dc/dcTypes'

interface NotificationListProps {
  notifications: NotificationResponse[]
  isLoading: boolean
  isError: boolean
  unreadCount: number
  onMarkRead: (id: number) => void
  onMarkAllRead: () => void
  className?: string
}

/**
 * DC in-app notification inbox list.
 *
 * Renders a vertically stacked list of notifications with unread indicator.
 * Mark-read and mark-all-read actions are emitted to the parent via callbacks.
 * Loading, error, and empty states are all handled here.
 */
export function NotificationList({
  notifications,
  isLoading,
  isError,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  className,
}: NotificationListProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={onMarkAllRead}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-4 py-3 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          Failed to load notifications.
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          You're all caught up — no notifications.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={cn(
                'px-4 py-3 flex items-start gap-3 group',
                !n.read && 'bg-primary/5',
              )}
            >
              {/* Unread dot */}
              <div className="mt-1.5 flex-shrink-0 w-2 h-2">
                {!n.read && (
                  <span className="block h-2 w-2 rounded-full bg-primary" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Mark read */}
              {!n.read && (
                <button
                  onClick={() => onMarkRead(n.id)}
                  className="flex-shrink-0 text-[10px] text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                  aria-label="Mark as read"
                >
                  ✓ Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
