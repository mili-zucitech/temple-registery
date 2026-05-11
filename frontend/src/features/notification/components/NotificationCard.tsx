import { NotificationResponse } from '../notificationApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMarkReadMutation, useDeleteNotificationMutation } from '../notificationApi'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Clock,
  AlertTriangle,
  Info,
  Trash2,
} from 'lucide-react'

interface NotificationCardProps {
  notification: NotificationResponse
  compact?: boolean
  onClick?: () => void
}

export function NotificationCard({ notification, compact = false, onClick }: NotificationCardProps) {
  const navigate = useNavigate()
  const [markRead] = useMarkReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await deleteNotification(notification.id).unwrap()
    } catch {
      // RTK Query error logger handles this centrally
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      markRead(notification.id)
    }
    // Prefer redirectUrl (workflow-aware deep link), fall back to actionUrl
    const target = notification.redirectUrl ?? notification.actionUrl
    if (target) {
      navigate(target)
    }
    onClick?.()
  }

  const priorityConfig = {
    LOW:      { color: 'bg-gray-100 text-gray-700 border-gray-300',   icon: Info },
    MEDIUM:   { color: 'bg-blue-100 text-blue-700 border-blue-300',   icon: Bell },
    HIGH:     { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
    CRITICAL: { color: 'bg-red-100 text-red-700 border-red-300',      icon: AlertTriangle },
  }

  const categoryIcon = {
    SUBMISSION:    FileText,
    APPROVAL:      CheckCircle2,
    REJECTION:     XCircle,
    CLARIFICATION: AlertCircle,
    SITE_VISIT:    Clock,
    REMINDER:      Clock,
    OVERDUE:       AlertTriangle,
    DOCUMENT:      FileText,
    SYSTEM:        Info,
  }

  // Derive icon from notificationType when available for more accuracy
  const iconFromType = () => {
    const t = notification.notificationType ?? ''
    if (t.includes('APPROVE')) return CheckCircle2
    if (t.includes('REJECT'))  return XCircle
    if (t.includes('CLARIF'))  return AlertCircle
    if (t.includes('TRUST') || t.includes('DOCUMENT')) return FileText
    return null
  }

  const priority = notification.priority || 'MEDIUM'
  const category = notification.category || 'SYSTEM'
  const config = priorityConfig[priority]
  const Icon = iconFromType() ?? categoryIcon[category] ?? Bell

  const content = (
    <div
      className={cn(
        'group relative p-4 hover:bg-accent/50 transition-colors cursor-pointer',
        !notification.read && 'bg-accent/20',
        compact && 'p-3',
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-1', compact && 'mt-0.5')}>
          <div className={cn('rounded-full p-2', config.color)}>
            <Icon className={cn('h-4 w-4', compact && 'h-3 w-3')} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-start gap-2 mb-1">
            <h4 className={cn(
              'font-medium text-sm flex-1 min-w-0',
              !notification.read && 'font-semibold',
              compact && 'text-xs',
            )}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>

          <p className={cn(
            'text-sm text-muted-foreground',
            compact ? 'text-xs line-clamp-1' : 'line-clamp-2',
          )}>
            {notification.body}
          </p>

          {/* Temple name badge — shown in full mode */}
          {!compact && notification.templeName && (
            <p className="text-xs text-primary/80 font-medium mt-1">
              {notification.templeName}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!compact && notification.priority && (
              <Badge variant="outline" className={cn('text-xs', config.color)}>
                {notification.priority}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>

          {!compact && (notification.redirectUrl ?? notification.actionUrl) && (
            <div className="mt-3">
              <Button size="sm" variant="outline" onClick={handleClick}>
                View Details
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete button — visible on hover */}
      <button
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity
                   h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground
                   hover:text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        aria-label="Delete notification"
      >
        <Trash2 className={cn('h-4 w-4', compact && 'h-3.5 w-3.5')} />
      </button>
    </div>
  )

  if (compact) {
    return content
  }

  return <Card className="overflow-hidden">{content}</Card>
}
