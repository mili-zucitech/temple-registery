import React from 'react'
import type { WorkflowStatus } from '../../types/workflow'
import { cn } from '../../lib/utils'

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus
  subStatus?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const STATUS_CONFIG: Record<WorkflowStatus, {
  label: string
  bg: string
  text: string
  border: string
  icon: string
  dot: string
}> = {
  DRAFT:                   { label: 'Draft',                 bg: 'bg-slate-100',    text: 'text-slate-600',   border: 'border-slate-200',  icon: '✏️', dot: 'bg-slate-400' },
  SUBMITTED:               { label: 'Submitted',             bg: 'bg-blue-50',      text: 'text-blue-700',    border: 'border-blue-200',   icon: '📤', dot: 'bg-blue-500' },
  UNDER_REVIEW:            { label: 'Under Review',          bg: 'bg-indigo-50',    text: 'text-indigo-700',  border: 'border-indigo-200', icon: '🔍', dot: 'bg-indigo-500' },
  CLARIFICATION_REQUESTED: { label: 'Clarification Needed',  bg: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200',  icon: '❓', dot: 'bg-amber-500' },
  CLARIFICATION_RESPONDED: { label: 'Response Submitted',    bg: 'bg-sky-50',       text: 'text-sky-700',     border: 'border-sky-200',    icon: '💬', dot: 'bg-sky-500' },
  RESUBMITTED:             { label: 'Resubmitted',           bg: 'bg-violet-50',    text: 'text-violet-700',  border: 'border-violet-200', icon: '🔄', dot: 'bg-violet-500' },
  APPROVED:                { label: 'Approved',              bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200',icon: '✅', dot: 'bg-emerald-500' },
  RE_APPROVED:             { label: 'Re-Approved',           bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200',icon: '✅', dot: 'bg-emerald-500' },
  REJECTED:                { label: 'Rejected',              bg: 'bg-red-50',       text: 'text-red-700',     border: 'border-red-200',    icon: '❌', dot: 'bg-red-500' },
  UPDATED_AFTER_APPROVAL:  { label: 'Edit Pending Review',   bg: 'bg-orange-50',    text: 'text-orange-700',  border: 'border-orange-200', icon: '⚠️', dot: 'bg-orange-500' },
  SUPERSEDED:              { label: 'Superseded',            bg: 'bg-gray-100',     text: 'text-gray-500',    border: 'border-gray-200',   icon: '📦', dot: 'bg-gray-400' },
  OVERDUE:                 { label: 'Overdue',               bg: 'bg-red-100',      text: 'text-red-800',     border: 'border-red-300',    icon: '⏰', dot: 'bg-red-600' },
  WITHDRAWN:               { label: 'Withdrawn',             bg: 'bg-gray-100',     text: 'text-gray-500',    border: 'border-gray-200',   icon: '↩️', dot: 'bg-gray-400' },
}

const SUB_STATUS_LABELS: Record<string, string> = {
  SITE_VISIT_SCHEDULED:    'Site Visit Scheduled',
  SITE_VISIT_COMPLETED:    'Site Visit Completed',
  PHYSICALLY_VERIFIED:     'Physically Verified',
  VERIFICATION_FAILED:     'Verification Failed',
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5 font-medium',
}

export const WorkflowStatusBadge: React.FC<WorkflowStatusBadgeProps> = ({
  status,
  subStatus,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT
  const subLabel = subStatus ? SUB_STATUS_LABELS[subStatus] : null

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap',
          config.bg, config.text, config.border,
          SIZE_CLASSES[size]
        )}
      >
        {/* Animated dot for active states */}
        {(status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'OVERDUE') ? (
          <span className="relative flex h-2 w-2">
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.dot)} />
            <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dot)} />
          </span>
        ) : (
          <span className={cn('inline-flex rounded-full h-2 w-2', config.dot)} />
        )}
        {showIcon && <span className="text-xs">{config.icon}</span>}
        {config.label}
      </span>

      {subLabel && (
        <span className="text-xs text-slate-500 pl-1">↳ {subLabel}</span>
      )}
    </div>
  )
}

export default WorkflowStatusBadge
