import React from 'react'
import { useGetWorkflowHistoryQuery } from './workflowApi'
import type { WorkflowTransitionHistory, WorkflowAction } from '../../types/workflow'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { cn } from '../../lib/utils'

interface WorkflowTimelineProps {
  workflowInstanceId: number
  className?: string
}

const ACTION_CONFIG: Partial<Record<WorkflowAction, { icon: string; color: string }>> = {
  SUBMIT:                 { icon: '📤', color: 'text-blue-600' },
  APPROVE:                { icon: '✅', color: 'text-emerald-600' },
  RE_APPROVE:             { icon: '✅', color: 'text-emerald-600' },
  REJECT:                 { icon: '❌', color: 'text-red-600' },
  REQUEST_CLARIFICATION:  { icon: '❓', color: 'text-amber-600' },
  RESPOND_CLARIFICATION:  { icon: '💬', color: 'text-sky-600' },
  RESUBMIT:               { icon: '🔄', color: 'text-violet-600' },
  BEGIN_REVIEW:           { icon: '🔍', color: 'text-indigo-600' },
  EDIT_APPROVED:          { icon: '⚠️', color: 'text-orange-600' },
  WITHDRAW:               { icon: '↩️', color: 'text-gray-600' },
  SCHEDULE_SITE_VISIT:    { icon: '📅', color: 'text-teal-600' },
  COMPLETE_SITE_VISIT:    { icon: '🏛️', color: 'text-teal-600' },
  VERIFY_SITE_VISIT:      { icon: '✔️', color: 'text-emerald-600' },
  FAIL_SITE_VISIT:        { icon: '⚠️', color: 'text-red-600' },
}

const ACTION_LABELS: Partial<Record<WorkflowAction, string>> = {
  SUBMIT:                 'Submitted for Review',
  APPROVE:                'Approved',
  RE_APPROVE:             'Re-Approved',
  REJECT:                 'Rejected',
  REQUEST_CLARIFICATION:  'Clarification Requested',
  RESPOND_CLARIFICATION:  'Clarification Response Submitted',
  RESUBMIT:               'Resubmitted',
  BEGIN_REVIEW:           'Placed Under Review',
  EDIT_APPROVED:          'Record Edited (Pending Re-approval)',
  WITHDRAW:               'Withdrawn',
  SCHEDULE_SITE_VISIT:    'Site Visit Scheduled',
  COMPLETE_SITE_VISIT:    'Site Visit Completed',
  VERIFY_SITE_VISIT:      'Physically Verified',
  FAIL_SITE_VISIT:        'Site Visit Failed',
  FLAG_OVERDUE:           'Marked Overdue',
}

const ROLE_LABELS: Record<string, string> = {
  TA: 'Temple Authority',
  DC: 'District Collector',
  SUPER_ADMIN: 'Super Admin',
  SYSTEM: 'System',
}

export const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  workflowInstanceId,
  className,
}) => {
  const { data: history, isLoading } = useGetWorkflowHistoryQuery(workflowInstanceId)

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <div className={cn('text-sm text-slate-400 text-center py-6', className)}>
        No history yet
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />

      <div className="space-y-4">
        {[...history].reverse().map((item, idx) => {
          const cfg = ACTION_CONFIG[item.action] ?? { icon: '📋', color: 'text-slate-600' }
          const label = ACTION_LABELS[item.action] ?? item.action
          const roleLabel = item.actorRole ? ROLE_LABELS[item.actorRole] ?? item.actorRole : ''
          const isFirst = idx === 0

          return (
            <div key={item.id} className="relative flex gap-4 pl-2">
              {/* Icon bubble */}
              <div className={cn(
                'relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                isFirst ? 'bg-slate-800 text-white ring-4 ring-white' : 'bg-white border-2 border-slate-200',
              )}>
                <span className={cn('text-sm', !isFirst && cfg.color)}>{cfg.icon}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={cn(
                      'font-medium text-sm',
                      isFirst ? 'text-slate-900' : 'text-slate-700'
                    )}>
                      {label}
                    </p>
                    {roleLabel && (
                      <p className="text-xs text-slate-500 mt-0.5">by {roleLabel}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <WorkflowStatusBadge status={item.toStatus} size="sm" showIcon={false} />
                    <time className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(item.performedAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>

                {item.comment && (
                  <div className="mt-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                    "{item.comment}"
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WorkflowTimeline
