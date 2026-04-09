import { cn } from '@/lib/utils'
import type { DeclarationStatus } from '@/features/declaration/declarationTypes'

type StatusVariant = DeclarationStatus | 'ACTIVE' | 'ON_LEAVE' | 'RETIRED' | 'SENT' | 'FAILED' | string

const VARIANT_CLASSES: Record<string, string> = {
  APPROVED:    'bg-success/10 text-success border-success/20',
  ACTIVE:      'bg-success/10 text-success border-success/20',
  SUBMITTED:   'bg-info/10 text-info border-info/20',
  SENT:        'bg-info/10 text-info border-info/20',
  DRAFT:       'bg-muted text-muted-foreground border-border',
  CLARIFICATION_REQUESTED: 'bg-warning/10 text-warning border-warning/20',
  PHYSICAL_VERIFICATION_REQUESTED: 'bg-accent/10 text-accent border-accent/20',
  ON_LEAVE:    'bg-warning/10 text-warning border-warning/20',
  REJECTED:    'bg-destructive/10 text-destructive border-destructive/20',
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
        'inline-flex items-center rounded-sm border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
        classes,
        className,
      )}
    >
      {label}
    </span>
  )
}
