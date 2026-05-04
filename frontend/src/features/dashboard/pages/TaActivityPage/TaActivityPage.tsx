import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { type NotificationResponse } from '@/features/notification/notificationApi'
import { useTaActivity } from './useTaActivity'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePagination } from '@/hooks/usePagination'
import { ROUTE_PATHS } from '@/constants/routePaths'
import {
  Bell, FileText, Building2, ClipboardList, CheckCheck,
  ChevronLeft, ChevronRight, File,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0 },
}

// Relative time formatter — "3 hours ago", "2 days ago", etc.
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function notifIcon(referenceType?: string) {
  switch (referenceType) {
    case 'TEMPLE':       return <Building2 size={16} />
    case 'DECLARATION':  return <ClipboardList size={16} />
    case 'DOCUMENT':     return <File size={16} />
    case 'TRUST':        return <FileText size={16} />
    default:             return <Bell size={16} />
  }
}

function referenceRoute(referenceType?: string, referenceId?: number): string | null {
  if (!referenceId) return null
  switch (referenceType) {
    case 'DECLARATION':
      return ROUTE_PATHS.TA_DECLARATION_DETAIL.replace(':id', String(referenceId))
    case 'TEMPLE':
      return ROUTE_PATHS.TA_TEMPLE
    case 'DOCUMENT':
      return ROUTE_PATHS.TA_DOCUMENTS
    case 'TRUST':
      return ROUTE_PATHS.TA_TRUST
    default:
      return null
  }
}

interface ActivityItemProps {
  notification: NotificationResponse
  onRead: (id: number) => void
  isMarking: boolean
}

function ActivityItem({ notification, onRead, isMarking }: ActivityItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.read) onRead(notification.id)
    const route = referenceRoute(notification.referenceType, notification.referenceId)
    if (route) navigate(route)
  }

  const isClickable = !!referenceRoute(notification.referenceType, notification.referenceId)

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'flex items-start gap-4 rounded-lg border bg-card px-5 py-4 shadow-soft-sm transition-all duration-150',
        !notification.read && 'border-l-[3px] border-l-primary border-r-border border-t-border border-b-border',
        notification.read && 'border-border opacity-75',
        isClickable && 'hover:shadow-soft-md cursor-pointer',
        !isClickable && 'cursor-default',
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
        notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary',
      )}>
        {notifIcon(notification.referenceType)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm leading-snug',
          notification.read ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground',
        )}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.body}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {relativeTime(notification.createdAt)}
        </span>
        {!notification.read && (
          <button
            className="h-2 w-2 rounded-full bg-primary"
            aria-label="Unread notification"
            onClick={(e) => {
              e.stopPropagation()
              if (!isMarking) onRead(notification.id)
            }}
            title="Mark as read"
          />
        )}
      </div>
    </motion.div>
  )
}

function ActivitySkeletonItem() {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-border bg-card px-5 py-4">
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-3 w-12 rounded bg-muted animate-pulse flex-shrink-0" />
    </div>
  )
}

export function TaActivityPage() {
  const { page, pageSize, goToPage } = usePagination()

  const {
    notifications, totalPages, totalElements, unreadCount,
    isLoading, isError, isMarking, isMarkingAll,
    markRead: handleMarkRead, markAllRead: handleMarkAll,
  } = useTaActivity(page, pageSize)

  return (
    <motion.div
      className="space-y-5 max-w-3xl"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      <motion.div variants={fadeUp}>
        <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <Bell size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Activity</h1>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Notifications and system events for your temple
                    {totalElements > 0 && <span className="ml-1">· {totalElements} total</span>}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  onClick={handleMarkAll}
                  disabled={isMarkingAll}
                >
                  <CheckCheck size={14} />
                  {isMarkingAll ? 'Marking…' : 'Mark all read'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div variants={fadeUp} className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ActivitySkeletonItem key={i} />)
        ) : isError ? (
          <EmptyState
            title="Failed to load activity"
            description="Unable to fetch notifications. Please try again."
            action={{ label: 'Retry', onClick: () => window.location.reload() }}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Activity like profile approvals, declaration updates, and DC messages will appear here."
            icon={<Bell size={44} />}
          />
        ) : (
          <motion.div
            className="space-y-2"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {notifications.map((n) => (
              <ActivityItem
                key={n.id}
                notification={n}
                onRead={handleMarkRead}
                isMarking={isMarking}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={fadeUp} className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => goToPage(page - 1)}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => goToPage(page + 1)}
            className="flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
