import { cn } from '@/lib/utils'
import type { NoticeStatus, NoticePriority } from '../noticeTypes'

const STATUS_CLASSES: Record<NoticeStatus, string> = {
  DRAFT:     'bg-muted text-muted-foreground border-border',
  PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
  ARCHIVED:  'bg-gray-200 text-gray-700 border-gray-300',
  EXPIRED:   'bg-red-100 text-red-700 border-red-200',
}

export function NoticeStatusBadge({ status, className }: { status: NoticeStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        STATUS_CLASSES[status] ?? 'bg-muted text-muted-foreground border-border',
        className,
      )}
    >
      {status}
    </span>
  )
}

const PRIORITY_CLASSES: Record<NoticePriority, string> = {
  HIGH:   'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
  LOW:    'bg-gray-100 text-gray-700 border-gray-200',
}

export function NoticePriorityBadge({ priority, className }: { priority: NoticePriority; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        PRIORITY_CLASSES[priority] ?? 'bg-muted text-muted-foreground border-border',
        className,
      )}
    >
      {priority}
    </span>
  )
}
