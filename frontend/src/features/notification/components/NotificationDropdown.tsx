import { useNavigate } from 'react-router-dom'
import { useNotificationDropdown } from '../hooks/useNotificationDropdown'
import { useMarkReadMutation } from '../notificationApi'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Link } from 'react-router-dom'
import {
  Bell, CheckCheck, Loader2, Trash2, X,
  CheckCircle2, XCircle, AlertCircle, FileText, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { NotificationResponse } from '../notificationApi'

interface NotificationDropdownProps {
  onClose: () => void
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

function notifIcon(n: NotificationResponse) {
  const type = n.notificationType ?? n.referenceType ?? 'SYSTEM'
  if (type.includes('APPROVE'))  return <CheckCircle2 className="h-4 w-4" />
  if (type.includes('REJECT'))   return <XCircle className="h-4 w-4" />
  if (type.includes('CLARIF'))   return <AlertCircle className="h-4 w-4" />
  if (type.includes('TRUST') || type.includes('DOCUMENT')) return <FileText className="h-4 w-4" />
  return <Bell className="h-4 w-4" />
}

function iconBg(n: NotificationResponse) {
  const type = n.notificationType ?? ''
  if (type.includes('APPROVE')) return 'bg-emerald-100 text-emerald-600'
  if (type.includes('REJECT'))  return 'bg-red-100 text-red-600'
  if (type.includes('CLARIF'))  return 'bg-amber-100 text-amber-600'
  return 'bg-blue-100 text-blue-600'
}

interface DropdownItemProps {
  notification: NotificationResponse
  onClose: () => void
  onDelete: (id: number) => void
}

function DropdownItem({ notification, onClose, onDelete }: DropdownItemProps) {
  const navigate = useNavigate()
  const [markRead] = useMarkReadMutation()

  const handleClick = async () => {
    if (!notification.read) {
      markRead(notification.id)
    }
    const target = notification.redirectUrl ?? notification.actionUrl
    if (target) {
      navigate(target)
    }
    onClose()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(notification.id)
  }

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
        'hover:bg-muted/60',
        !notification.read && 'bg-primary/5',
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      <div className="mt-1 flex-shrink-0 w-2 h-2">
        {!notification.read && (
          <span className="block h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      {/* Type icon */}
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
        iconBg(notification),
      )}>
        {notifIcon(notification)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <p className={cn(
          'text-xs leading-snug truncate',
          notification.read ? 'text-muted-foreground' : 'font-semibold text-foreground',
        )}>
          {notification.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
          {notification.body}
        </p>
        {notification.templeName && (
          <p className="text-[10px] text-primary/70 mt-0.5 font-medium truncate">
            {notification.templeName}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {relativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Delete button — visible on hover */}
      <button
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity
                   h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground
                   hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        aria-label="Delete notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="mt-1 w-2 h-2 rounded-full bg-muted" />
      <div className="h-8 w-8 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-1/3 rounded bg-muted" />
      </div>
    </div>
  )
}

// ── Dropdown ──────────────────────────────────────────────────────────────────

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications, hasUnread,
    isLoading, isError,
    isMarkingAllRead, isClearing,
    refetch,
    handleMarkAllRead, handleDelete, handleClearAll,
  } = useNotificationDropdown()

  return (
    <div className="flex flex-col w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Notifications</span>
        </div>
        <div className="flex items-center gap-1">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={isMarkingAllRead}
              title="Mark all as read"
            >
              {isMarkingAllRead
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <CheckCheck className="h-3.5 w-3.5" />}
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2 text-muted-foreground hover:text-destructive"
              onClick={handleClearAll}
              disabled={isClearing}
              title="Clear all notifications"
            >
              {isClearing
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto overscroll-contain divide-y divide-border/50">
        {isLoading ? (
          <>
            <ItemSkeleton />
            <ItemSkeleton />
            <ItemSkeleton />
          </>
        ) : isError ? (
          <div className="px-4 py-8 text-center space-y-2">
            <Info className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Failed to load notifications.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">You're all caught up!</p>
            <p className="text-xs text-muted-foreground">No new notifications</p>
          </div>
        ) : (
          notifications.map((n) => (
            <DropdownItem
              key={n.id}
              notification={n}
              onClose={onClose}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link to="/notifications" onClick={onClose}>
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
