import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useListNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } from '@/features/notification/notificationApi'
import type { NotificationResponse } from '@/features/notification/notificationApi'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePagination } from '@/hooks/usePagination'
import {
  Bell, CheckCheck, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, FileText, Building2, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0 },
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function notifIcon(n: NotificationResponse) {
  const type = n.notificationType ?? n.referenceType ?? ''
  if (type.includes('APPROVE'))   return <CheckCircle2 size={16} />
  if (type.includes('REJECT'))    return <XCircle size={16} />
  if (type.includes('CLARIF'))    return <AlertCircle size={16} />
  if (type.includes('TRUST'))     return <FileText size={16} />
  if (type.includes('TEMPLE'))    return <Building2 size={16} />
  return <Info size={16} />
}

function iconBg(n: NotificationResponse) {
  const type = n.notificationType ?? ''
  if (type.includes('APPROVE')) return 'bg-emerald-100 text-emerald-600'
  if (type.includes('REJECT'))  return 'bg-red-100 text-red-600'
  if (type.includes('CLARIF'))  return 'bg-amber-100 text-amber-600'
  return 'bg-blue-100 text-blue-600'
}

interface ActivityItemProps {
  notification: NotificationResponse
  onRead: (id: number) => void
}

function ActivityItem({ notification, onRead }: ActivityItemProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (!notification.read) onRead(notification.id)
    // DC notifications redirect to temple profile
    const target = notification.redirectUrl
      ?? (notification.templeId ? `/dc/temples/${notification.templeId}` : null)
    if (target) navigate(target)
  }

  const isClickable = !!(notification.redirectUrl ?? notification.templeId)

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        'flex items-start gap-4 rounded-lg border bg-card px-5 py-4 shadow-sm transition-all',
        !notification.read && 'border-l-[3px] border-l-primary',
        notification.read && 'border-border opacity-80',
        isClickable && 'hover:shadow-md cursor-pointer',
        !isClickable && 'cursor-default',
      )}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full',
        iconBg(notification),
      )}>
        {notifIcon(notification)}
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
        {notification.templeName && (
          <p className="text-[11px] text-primary/70 font-medium mt-0.5">{notification.templeName}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0 min-w-[70px]">
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {relativeTime(notification.createdAt)}
        </span>
        {!notification.read && (
          <button
            className="h-2 w-2 rounded-full bg-primary"
            aria-label="Unread"
            onClick={(e) => { e.stopPropagation(); onRead(notification.id) }}
          />
        )}
      </div>
    </motion.div>
  )
}

function SkeletonItem() {
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

export function DcActivityPage() {
  const { page, goToPage } = usePagination()
  const [_page, setPage] = useState(0)
  const currentPage = page ?? _page

  const { data, isLoading, isError, refetch } = useListNotificationsQuery({ page: currentPage, size: PAGE_SIZE })
  const [markRead] = useMarkReadMutation()
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllReadMutation()

  const notifications = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0
  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkRead = (id: number) => markRead(id)
  const handleMarkAll  = () => markAllRead()

  return (
    <motion.div
      className="space-y-5 max-w-3xl"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.06 } } }}
    >
      {/* Header card */}
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
                    Incoming submissions, temple updates, and system events
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
          Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
        ) : isError ? (
          <EmptyState
            title="Failed to load activity"
            description="Unable to fetch notifications. Please try again."
            action={{ label: 'Retry', onClick: () => refetch() }}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Temple submissions, trust reviews, and document uploads will appear here."
            icon={<Bell size={44} />}
          />
        ) : (
          <motion.div
            className="space-y-2"
            variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          >
            {notifications.map((n) => (
              <ActivityItem key={n.id} notification={n} onRead={handleMarkRead} />
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
            disabled={currentPage === 0}
            onClick={() => { goToPage?.(currentPage - 1); setPage(currentPage - 1) }}
            className="flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages - 1}
            onClick={() => { goToPage?.(currentPage + 1); setPage(currentPage + 1) }}
            className="flex items-center gap-1"
          >
            Next <ChevronRight size={14} />
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}
