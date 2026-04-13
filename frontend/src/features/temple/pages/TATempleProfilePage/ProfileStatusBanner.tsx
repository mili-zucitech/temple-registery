import { AlertCircle, CheckCircle2, Clock, FilePlus, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TaProfileStatus } from '@/features/temple/templeTypes'

interface ProfileStatusBannerProps {
  status: TaProfileStatus
  reviewComment?: string
}

const BANNER_CONFIG: Record<
  TaProfileStatus,
  { icon: React.ReactNode; bg: string; border: string; text: string; title: string; body: string }
> = {
  NOT_STARTED: {
    icon: <FilePlus size={16} className="flex-shrink-0" />,
    bg: 'bg-info/8',
    border: 'border-info/25',
    text: 'text-info',
    title: 'Profile not started',
    body: 'Fill in the editable fields below and save a draft to begin. Once all required fields are complete, submit for DC review.',
  },
  DRAFT: {
    icon: <Info size={16} className="flex-shrink-0" />,
    bg: 'bg-warning/8',
    border: 'border-warning/25',
    text: 'text-warning',
    title: 'Draft in progress',
    body: 'You have unsaved or saved-but-unsubmitted changes. Complete the form and click "Submit for Approval" when ready.',
  },
  SUBMITTED: {
    icon: <Clock size={16} className="flex-shrink-0" />,
    bg: 'bg-info/8',
    border: 'border-info/25',
    text: 'text-info',
    title: 'Under DC review',
    body: 'Your profile has been submitted to the District Collector for review. Editing is locked until a decision is made.',
  },
  APPROVED: {
    icon: <CheckCircle2 size={16} className="flex-shrink-0" />,
    bg: 'bg-success/8',
    border: 'border-success/25',
    text: 'text-success',
    title: 'Profile approved',
    body: 'Your temple profile is live and visible to the District Collector. Click "Edit Profile" to propose changes.',
  },
  REJECTED: {
    icon: <XCircle size={16} className="flex-shrink-0" />,
    bg: 'bg-destructive/8',
    border: 'border-destructive/25',
    text: 'text-destructive',
    title: 'Profile rejected',
    body: 'The DC has rejected your submission. Please review the feedback below, make corrections, and resubmit.',
  },
}

export function ProfileStatusBanner({ status, reviewComment }: ProfileStatusBannerProps) {
  const cfg = BANNER_CONFIG[status]
  return (
    <div className={cn('rounded-xl border p-4', cfg.bg, cfg.border)}>
      <div className={cn('flex items-start gap-2.5', cfg.text)}>
        <span className="mt-0.5">{cfg.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{cfg.title}</p>
          <p className="text-sm opacity-80 mt-0.5">{cfg.body}</p>

          {status === 'REJECTED' && reviewComment && (
            <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle size={13} className="text-destructive flex-shrink-0" />
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide">DC Remarks</p>
              </div>
              <p className="text-sm text-destructive/90 leading-relaxed">{reviewComment}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
