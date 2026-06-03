import { cn } from '@/lib/utils'
import type { DeclarationStatus } from '@/features/declaration/declarationTypes'

type StatusVariant = DeclarationStatus | 'ACTIVE' | 'ON_LEAVE' | 'RETIRED' | 'SENT' | 'FAILED' | string

const VARIANT_CLASSES: Record<string, string> = {
  // Canonical 12 declaration statuses
  DRAFT:                    'bg-muted text-muted-foreground border-border',
  SUBMITTED:                'bg-blue-100 text-blue-800 border-blue-200',
  UNDER_REVIEW:             'bg-amber-100 text-amber-800 border-amber-200',
  CLARIFICATION_REQUIRED:   'bg-orange-100 text-orange-800 border-orange-200',
  CLARIFICATION_RESPONDED:  'bg-sky-100 text-sky-800 border-sky-200',
  SITE_VISIT_SCHEDULED:     'bg-purple-100 text-purple-800 border-purple-200',
  SITE_VISIT_COMPLETED:     'bg-indigo-100 text-indigo-800 border-indigo-200',
  VERIFIED:                 'bg-teal-100 text-teal-800 border-teal-200',
  APPROVED:                 'bg-green-100 text-green-800 border-green-200',
  REJECTED:                 'bg-red-100 text-red-800 border-red-200',
  OVERDUE:                  'bg-red-200 text-red-900 border-red-300 animate-pulse',
  SUPERSEDED:               'bg-gray-200 text-gray-700 border-gray-300',
  // Legacy / other module statuses kept for backward compatibility
  ACTIVE:                   'bg-success/10 text-success border-success/20',
  PENDING_REVIEW:           'bg-info/10 text-info border-info/20',
  RESUBMITTED:              'bg-info/20 text-info border-info/30',
  SENT:                     'bg-info/10 text-info border-info/20',
  CLARIFICATION_REQUESTED:  'bg-warning/10 text-warning border-warning/20',
  PHYSICAL_VERIFICATION_REQUESTED: 'bg-accent/10 text-accent border-accent/20',
  ON_LEAVE:                 'bg-warning/10 text-warning border-warning/20',
  RETIRED:                  'bg-muted text-muted-foreground border-border',
  FAILED:                   'bg-destructive/10 text-destructive border-destructive/20',
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

const LABEL_OVERRIDES: Partial<Record<string, string>> = {
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Done',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = VARIANT_CLASSES[status] ?? 'bg-muted text-muted-foreground border-border'
  const label = LABEL_OVERRIDES[status] ?? status.replace(/_/g, ' ')

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium uppercase tracking-label',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}

/**
 * Renders the primary status badge plus an optional "Overdue" secondary badge
 * when `isOverdue` is true. The overdue badge is shown alongside (not replacing)
 * the primary status badge.
 */
export function DeclarationStatusBadge({
  status,
  isOverdue,
  className,
}: {
  status: StatusVariant
  isOverdue?: boolean | null
  className?: string
}) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <StatusBadge status={status} />
      {isOverdue && (
        <span className="inline-flex items-center rounded-sm border border-red-300 bg-red-100 px-2 py-0.5 text-xs font-medium uppercase tracking-label text-red-800">
          Overdue
        </span>
      )}
    </span>
  )
}
