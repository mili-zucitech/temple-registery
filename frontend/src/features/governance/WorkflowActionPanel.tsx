import React, { useState } from 'react'
import { useExecuteActionMutation } from './workflowApi'
import type { AvailableAction, WorkflowAction } from '../../types/workflow'
import { cn } from '../../lib/utils'

const uuidv4 = () => crypto.randomUUID()

interface WorkflowActionPanelProps {
  workflowInstanceId: number
  lockVersion: number
  availableActions: AvailableAction[]
  onSuccess?: (action: WorkflowAction) => void
  className?: string
  compact?: boolean
}

const ACTION_STYLES: Partial<Record<WorkflowAction, string>> = {
  APPROVE:                'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
  RE_APPROVE:             'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200',
  REJECT:                 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
  REQUEST_CLARIFICATION:  'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
  BEGIN_REVIEW:           'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200',
  SUBMIT:                 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
  RESUBMIT:               'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200',
  RESPOND_CLARIFICATION:  'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-200',
  EDIT_APPROVED:          'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200',
  WITHDRAW:               'bg-slate-500 hover:bg-slate-600 text-white',
}

export const WorkflowActionPanel: React.FC<WorkflowActionPanelProps> = ({
  workflowInstanceId,
  lockVersion,
  availableActions,
  onSuccess,
  className,
  compact = false,
}) => {
  const [executeAction, { isLoading }] = useExecuteActionMutation()
  const [activeAction, setActiveAction] = useState<WorkflowAction | null>(null)
  const [comment, setComment] = useState('')
  const [showConfirm, setShowConfirm] = useState<AvailableAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!availableActions || availableActions.length === 0) return null

  const handleActionClick = (action: AvailableAction) => {
    setError(null)
    if (action.confirmationMessage || action.requiresComment) {
      setShowConfirm(action)
      setActiveAction(action.action)
      setComment('')
    } else {
      executeTransition(action, '')
    }
  }

  const executeTransition = async (action: AvailableAction, actionComment: string) => {
    try {
      await executeAction({
        instanceId: workflowInstanceId,
        action: {
          action: action.action,
          expectedVersion: action.requiresVersion ? lockVersion : undefined,
          idempotencyKey: uuidv4(),
          comment: actionComment || undefined,
        },
      }).unwrap()
      setShowConfirm(null)
      setActiveAction(null)
      setComment('')
      onSuccess?.(action.action)
    } catch (err: any) {
      setError(err?.data?.message ?? err?.message ?? 'Action failed. Please try again.')
    }
  }

  const handleConfirm = () => {
    if (!showConfirm) return
    if (showConfirm.requiresComment && !comment.trim()) {
      setError('Please provide a reason before proceeding.')
      return
    }
    executeTransition(showConfirm, comment)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Action Buttons */}
      {!showConfirm && (
        <div className={cn('flex flex-wrap gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}>
          {availableActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleActionClick(action)}
              disabled={isLoading}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-150 shadow-md hover:shadow-lg active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                ACTION_STYLES[action.action] ?? 'bg-slate-700 hover:bg-slate-800 text-white',
                compact ? 'px-3 py-1.5 text-xs' : ''
              )}
            >
              {isLoading && activeAction === action.action ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Confirm / Comment Panel */}
      {showConfirm && (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{showConfirm.label}</p>
              {showConfirm.confirmationMessage && (
                <p className="text-xs text-slate-500 mt-0.5">{showConfirm.confirmationMessage}</p>
              )}
            </div>
            <button
              onClick={() => { setShowConfirm(null); setActiveAction(null); setError(null) }}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {showConfirm.requiresComment && (
            <textarea
              value={comment}
              onChange={(e) => { setComment(e.target.value); setError(null) }}
              placeholder="Enter reason or comment..."
              rows={3}
              className={cn(
                'w-full rounded-lg border px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-none',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
              )}
            />
          )}

          {error && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
                'transition-all duration-150',
                ACTION_STYLES[showConfirm.action] ?? 'bg-slate-700 text-white',
                'disabled:opacity-50'
              )}
            >
              {isLoading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Confirm {showConfirm.label}
            </button>
            <button
              onClick={() => { setShowConfirm(null); setActiveAction(null); setError(null) }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowActionPanel
