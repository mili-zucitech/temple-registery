import { cn } from '@/lib/utils'
import type { TaProfileStatus } from '@/features/temple-profile/hooks/templeTypes'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2, Clock, FileEdit, XCircle,
} from 'lucide-react'

interface StatusBannerProps {
  status: TaProfileStatus
  reviewComment?: string | null
  className?: string
}

interface BannerConfig {
  icon: LucideIcon
  bg: string
  border: string
  text: string
  heading: string
  body: string
}

const CONFIG: Record<TaProfileStatus, BannerConfig> = {
  NOT_STARTED: {
    icon: FileEdit,
    bg: 'bg-warning/5',
    border: 'border-warning/30',
    text: 'text-warning',
    heading: 'Temple Profile Incomplete',
    body: 'Complete and submit your temple profile for District Collector review to get it published.',
  },
  DRAFT: {
    icon: FileEdit,
    bg: 'bg-info/5',
    border: 'border-info/30',
    text: 'text-info',
    heading: 'Draft in Progress',
    body: 'You have an unsaved draft. Save it and submit for DC review when ready.',
  },
  SUBMITTED: {
    icon: Clock,
    bg: 'bg-info/5',
    border: 'border-info/30',
    text: 'text-info',
    heading: 'Pending DC Review',
    body: "Your profile update has been submitted and is awaiting the District Collector's review. Editing is locked until a decision is received.",
  },
  APPROVED: {
    icon: CheckCircle2,
    bg: 'bg-success/5',
    border: 'border-success/30',
    text: 'text-success',
    heading: 'Profile Published',
    body: 'Your temple profile has been approved by the District Collector and is now published.',
  },
  REJECTED: {
    icon: XCircle,
    bg: 'bg-destructive/5',
    border: 'border-destructive/30',
    text: 'text-destructive',
    heading: 'Profile Update Rejected',
    body: 'Your profile update was rejected by the District Collector. Review the comment below and create a new draft.',
  },
}

export function StatusBanner({ status, reviewComment, className }: StatusBannerProps) {
  const cfg = CONFIG[status]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4',
        cfg.bg,
        cfg.border,
        className,
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', cfg.text)} />
      <div className="space-y-0.5 min-w-0">
        <p className={cn('text-sm font-semibold', cfg.text)}>{cfg.heading}</p>
        <p className="text-sm text-muted-foreground">{cfg.body}</p>
        {status === 'REJECTED' && reviewComment && (
          <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
            <p className="text-xs font-semibold text-destructive mb-1">DC Comment</p>
            <p className="text-sm text-foreground">{reviewComment}</p>
          </div>
        )}
        
      </div>
    </div>
  )
}
