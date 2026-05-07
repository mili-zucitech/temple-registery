import { cn } from '@/lib/utils'
import type { TaProfileStatus } from '@/features/temple-profile/hooks/templeTypes'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle, CheckCircle2, Clock, FileEdit, XCircle,
} from 'lucide-react'

interface StatusBannerProps {
  status: TaProfileStatus
  reviewComment?: string | null
  className?: string
  onCreateNewDraft?: () => void
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
    bg: 'bg-warning/10',
    border: 'border-warning/40',
    text: 'text-warning-foreground',
    heading: 'Temple Profile Incomplete',
    body: 'Complete and submit your temple profile for District Collector review to get it published.',
  },
  DRAFT: {
    icon: FileEdit,
    bg: 'bg-info/10',
    border: 'border-info/40',
    text: 'text-info-foreground',
    heading: 'Draft in Progress',
    body: 'You have an unsaved draft. Save it and submit for DC review when ready.',
  },
  SUBMITTED: {
    icon: Clock,
    bg: 'bg-info/10',
    border: 'border-info/40',
    text: 'text-info-foreground',
    heading: 'Pending DC Review',
    body: "Your profile update has been submitted and is awaiting the District Collector's review. Editing is locked until a decision is received.",
  },
  APPROVED: {
    icon: CheckCircle2,
    bg: 'bg-success/10',
    border: 'border-success/40',
    text: 'text-success-foreground',
    heading: 'Profile Published',
    body: 'Your temple profile has been approved by the District Collector and is now published.',
  },
  REJECTED: {
    icon: XCircle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/40',
    text: 'text-destructive-foreground',
    heading: 'Profile Update Rejected',
    body: 'Your profile update was rejected by the District Collector. Review the comment below and create a new draft.',
  },
  FLAGGED: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    border: 'border-warning/40',
    text: 'text-warning-foreground',
    heading: 'Profile Flagged By District Collector',
    body: 'The District Collector has flagged your profile. Please edit the profile and resubmit for review.',
  },
<<<<<<< HEAD
=======
  UPDATED_AFTER_APPROVAL: {
    icon: FileEdit,
    bg: 'bg-info/10',
    border: 'border-info/40',
    text: 'text-info-foreground',
    heading: 'Edit In Progress — Resubmission Required',
    body: 'You are editing your approved profile. Save your changes and resubmit for DC review to publish the update.',
  },
  RESUBMITTED: {
    icon: Clock,
    bg: 'bg-info/10',
    border: 'border-info/40',
    text: 'text-info-foreground',
    heading: 'Resubmitted — Awaiting DC Review',
    body: 'Your updated profile has been resubmitted and is awaiting the District Collector\'s review. Editing is locked until a decision is received.',
  },
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
}

export function StatusBanner({ status, reviewComment, className, onCreateNewDraft }: StatusBannerProps) {
  const cfg = CONFIG[status]
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-xl border-2 p-5 shadow-sm',
        cfg.bg,
        cfg.border,
        className,
      )}
    >
      <div className={cn('p-2 rounded-lg bg-background/50 shrink-0', cfg.text)}>
        <Icon size={20} className="shrink-0" />
      </div>
      <div className="space-y-1 min-w-0 flex-1">
        <p className={cn('text-base font-bold', cfg.text)}>{cfg.heading}</p>
        <p className="text-sm text-muted-foreground leading-relaxed">{cfg.body}</p>
        {status === 'REJECTED' && reviewComment && (
          <div className="mt-3 rounded-lg border-2 border-destructive/30 bg-destructive/5 px-4 py-3">
            <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1.5">DC Comment</p>
            <p className="text-sm text-foreground leading-relaxed">{reviewComment}</p>
          </div>
        )}
        {status === 'REJECTED' && onCreateNewDraft && (
          <Button
            size="sm"
            variant="destructive"
            className="mt-3"
            onClick={onCreateNewDraft}
          >
            Create New Draft
          </Button>
        )}
      </div>
    </div>
  )
}
