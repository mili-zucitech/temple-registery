import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ModuleVerificationStatus = 'VERIFIED' | 'FLAGGED' | 'PENDING'

/**
 * Derives the 3-state module verification status from the two boolean fields
 * stored on each governance entity (isVerifiedByDc + dcFlagReason).
 */
export function deriveModuleStatus(
  isVerifiedByDc: boolean | undefined,
  dcFlagReason: string | null | undefined,
): ModuleVerificationStatus {
  if (isVerifiedByDc) return 'VERIFIED'
  if (dcFlagReason) return 'FLAGGED'
  return 'PENDING'
}

interface ModuleStatusBadgeProps {
  status: ModuleVerificationStatus
  className?: string
}

/**
 * Consistent 3-state badge for module-level DC verification status.
 * VERIFIED = green, FLAGGED = red, PENDING = amber.
 */
export function ModuleStatusBadge({ status, className }: ModuleStatusBadgeProps) {
  if (status === 'VERIFIED') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
        'bg-emerald-50 text-emerald-700 border border-emerald-100',
        className
      )}>
        <CheckCircle2 size={11} className="shrink-0" />
        Verified
      </span>
    )
  }
  if (status === 'FLAGGED') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
        'bg-red-50 text-red-700 border border-red-100',
        className
      )}>
        <AlertTriangle size={11} className="shrink-0" />
        Flagged
      </span>
    )
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider',
      'bg-amber-50 text-amber-700 border border-amber-100',
      className
    )}>
      <Clock size={11} className="shrink-0" />
      Pending
    </span>
  )
}
