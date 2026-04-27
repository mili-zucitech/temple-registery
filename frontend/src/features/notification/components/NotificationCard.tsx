import { NotificationResponse } from '../notificationApi'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMarkReadMutation } from '../notificationApi'
import { Link } from 'react-router-dom'
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
} from 'lucide-react'

interface NotificationCardProps {
  notification: NotificationResponse
  compact?: boolean
  onClick?: () => void
}

export function NotificationCard({ notification, compact = false, onClick }: NotificationCardProps) {
  const [markRead] = useMarkReadMutation()

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!notification.read) {
      try {
        await markRead(notification.id).unwrap()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const handleClick = () => {
    if (!notification.read) {
      markRead(notification.id)
    }
    onClick?.()
  }

  const priorityConfig = {
    LOW: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Info },
    MEDIUM: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Bell },
    HIGH: { color: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertCircle },
    CRITICAL: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertTriangle },
  }

  const categoryIcon = {
    SUBMISSION: FileText,
    APPROVAL: CheckCircle2,
    REJECTION: XCircle,
    CLARIFICATION: AlertCircle,
    SITE_VISIT: Clock,
    REMINDER: Clock,
    OVERDUE: AlertTriangle,
    DOCUMENT: FileText,
    SYSTEM: Info,
  }

  const priority = notification.priority || 'MEDIUM'
  const category = notification.category || 'SYSTEM'
  const config = priorityConfig[priority]
  const Icon = categoryIcon[category] || Bell

  const content = (
    <div
      className={cn(
        'p-4 hover:bg-accent/50 transition-colors cursor-pointer',
        !notification.read && 'bg-accent/20',
        compact && 'p-3'
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
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                'font-medium text-sm',
                !notification.read && 'font-semibold',
                compact && 'text-xs'
              )}
            >
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
            )}
          </div>

          <p
            className={cn(
              'text-sm text-muted-foreground line-clamp-2',
              compact && 'text-xs line-clamp-1'
            )}
          >
            {notification.body}
          </p>

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

          {!compact && notification.actionUrl && (
            <div className="mt-3">
              <Link to={notification.actionUrl} onClick={handleClick}>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (compact) {
    return content
  }

  return <Card className="overflow-hidden">{content}</Card>
}
