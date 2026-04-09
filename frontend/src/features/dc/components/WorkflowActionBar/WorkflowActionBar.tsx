import { Check, X, HelpCircle, Clipboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ActionKind = 'approve' | 'reject' | 'clarify' | 'flag-physical'

interface WorkflowActionBarProps {
  /** Whether the current user has permission to take workflow actions. */
  canAct: boolean
  /** Whether any action is currently being submitted. */
  isSubmitting?: boolean
  className?: string
  onApprove: () => void
  onReject: () => void
  onClarify: () => void
  onFlagPhysical: () => void
}

/**
 * RBAC-gated workflow action bar for declaration review.
 *
 * When canAct is false (DC_STAFF) the bar renders a read-only notice.
 * When canAct is true (DISTRICT_COLLECTOR, SUPER_ADMIN) all four action
 * buttons are shown. All actions are disabled while isSubmitting is true.
 *
 * Business logic (API calls, dialogs) is handled by the parent via the
 * on* callbacks — this component is purely presentational.
 */
export function WorkflowActionBar({
  canAct,
  isSubmitting = false,
  className,
  onApprove,
  onReject,
  onClarify,
  onFlagPhysical,
}: WorkflowActionBarProps) {
  if (!canAct) {
    return (
      <div className={cn('px-5 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground', className)}>
        Read-only access — only District Collectors can take workflow actions.
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap gap-2 px-5 py-3 bg-muted/30 border-t border-border', className)}>
      <ActionButton
        label="Approve"
        icon={<Check size={14} />}
        onClick={onApprove}
        disabled={isSubmitting}
        variant="default"
      />
      <ActionButton
        label="Reject"
        icon={<X size={14} />}
        onClick={onReject}
        disabled={isSubmitting}
        variant="destructive"
      />
      <ActionButton
        label="Request Clarification"
        icon={<HelpCircle size={14} />}
        onClick={onClarify}
        disabled={isSubmitting}
        variant="outline"
      />
      <ActionButton
        label="Flag Physical Verification"
        icon={<Clipboard size={14} />}
        onClick={onFlagPhysical}
        disabled={isSubmitting}
        variant="outline"
      />
    </div>
  )
}

// ─── Internal helper ──────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled: boolean
  variant: 'default' | 'destructive' | 'outline'
}

function ActionButton({ label, icon, onClick, disabled, variant }: ActionButtonProps) {
  return (
    <Button size="sm" variant={variant} onClick={onClick} disabled={disabled} className="gap-1">
      {icon}
      {label}
    </Button>
  )
}
