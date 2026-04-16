import { cn } from '@/lib/utils'
import type { DeclarationStatus } from '@/features/declaration/declarationTypes'

type StatusVariant = DeclarationStatus | 'ACTIVE' | 'ON_LEAVE' | 'RETIRED' | 'SENT' | 'FAILED' | string

const VARIANT_CLASSES: Record<string, string> = {
  APPROVED:    'bg-success/10 text-success border-success/20',
  ACTIVE:      'bg-success/10 text-success border-success/20',
  SUBMITTED:   'bg-info/10 text-info border-info/20',
  PENDING_REVIEW: 'bg-info/10 text-info border-info/20',
  UNDER_REVIEW: 'bg-primary/10 text-primary border-primary/20',
  RESUBMITTED:  'bg-info/20 text-info border-info/30',
  SENT:        'bg-info/10 text-info border-info/20',
  DRAFT:       'bg-muted text-muted-foreground border-border',
  CLARIFICATION_REQUESTED: 'bg-warning/10 text-warning border-warning/20',
  PHYSICAL_VERIFICATION_REQUESTED: 'bg-accent/10 text-accent border-accent/20',
  ON_LEAVE:    'bg-warning/10 text-warning border-warning/20',
  REJECTED:    'bg-destructive/10 text-destructive border-destructive/20',
  OVERDUE:     'bg-destructive/20 text-destructive border-destructive/30 animate-pulse',
  RETIRED:     'bg-muted text-muted-foreground border-border',
  FAILED:      'bg-destructive/10 text-destructive border-destructive/20',
}

interface StatusBadgeProps {
  status: StatusVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const classes = VARIANT_CLASSES[status] ?? 'bg-muted text-muted-foreground border-border'
  const label = status.replace(/_/g, ' ')

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
