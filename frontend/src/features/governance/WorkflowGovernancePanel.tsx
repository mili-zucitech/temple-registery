import React, { useState } from 'react'
import { useGetWorkflowStateQuery, useGetPendingCountQuery } from './workflowApi'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { WorkflowActionPanel } from './WorkflowActionPanel'
import { WorkflowTimeline } from './WorkflowTimeline'
import { ClarificationInbox } from './ClarificationInbox'
import type { WorkflowEntityType, WorkflowAction } from '../../types/workflow'
import { cn } from '../../lib/utils'

interface WorkflowGovernancePanelProps {
  /** Workflow instance ID (from entity's workflow_instance). */
  workflowInstanceId: number
  entityType?: WorkflowEntityType
  viewerRole?: 'TA' | 'DC' | 'DC_STAFF' | 'SUPER_ADMIN'
  viewerUserId?: number
  className?: string
  onActionSuccess?: (action: WorkflowAction) => void
  /** If true, collapse into a compact accordion. Good for embedded views. */
  compact?: boolean
}

type Tab = 'actions' | 'clarification' | 'history'

/**
 * WorkflowGovernancePanel — the unified governance panel composing all workflow UI.
 *
 * Replaces module-specific governance sidebars across:
 *   - TrustGovernanceSection
 *   - DeclarationWorkflowPanel
 *   - TempleProfileReviewSidebar
 *
 * Usage:
 *   <WorkflowGovernancePanel
 *     workflowInstanceId={trust.workflowInstanceId}
 *     entityType="TRUST"
 *     viewerRole={currentUser.role}
 *     viewerUserId={currentUser.id}
 *   />
 */
export const WorkflowGovernancePanel: React.FC<WorkflowGovernancePanelProps> = ({
  workflowInstanceId,
  entityType,
  viewerRole,
  viewerUserId,
  className,
  onActionSuccess,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('actions')
  const [isExpanded, setIsExpanded] = useState(!compact)

  const { data: state, isLoading, refetch } = useGetWorkflowStateQuery(workflowInstanceId, {
    pollingInterval: 30_000, // refresh every 30s as SSE fallback
  })

  const showClarificationBadge =
    state?.status === 'CLARIFICATION_REQUESTED' ||
    (state?.clarification?.activeThreads ?? 0) > 0

  const isDcReadOnly = viewerRole === 'DC_STAFF'
  const isTa = viewerRole === 'TA'
  const isDc = viewerRole === 'DC' || viewerRole === 'SUPER_ADMIN'

  const handleSuccess = (action: WorkflowAction) => {
    refetch()
    onActionSuccess?.(action)
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse space-y-3 p-4 bg-white rounded-2xl border border-slate-100', className)}>
        <div className="h-6 bg-slate-100 rounded w-1/3" />
        <div className="h-10 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded w-1/2" />
      </div>
    )
  }

  if (!state) return null

  const TABS: { key: Tab; label: string; badge?: string }[] = [
    { key: 'actions',       label: 'Actions',       badge: state.availableActions.length > 0 ? String(state.availableActions.length) : undefined },
    { key: 'clarification', label: 'Clarification', badge: showClarificationBadge ? '!' : undefined },
    { key: 'history',       label: 'History' },
  ]

  return (
    <div className={cn(
      'bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300',
      className
    )}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {(entityType ?? 'ENTITY').replace('_', ' ')} · Governance
            </p>
            <WorkflowStatusBadge
              status={state.status}
              subStatus={state.subStatus}
              size="md"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">v{state.version}</span>
          {compact && (
            <button
              onClick={() => setIsExpanded(e => !e)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              {isExpanded ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Tab Bar */}
          <div className="flex border-b border-slate-100 bg-white">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 py-3 text-sm font-medium transition-colors relative',
                  activeTab === tab.key
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                {tab.label}
                {tab.badge && (
                  <span className={cn(
                    'ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold',
                    tab.badge === '!' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'actions' && (
              <div className="space-y-4">
                {/* Current actor hint */}
                {state.currentActor && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    state.currentActor === 'TA' ? 'bg-blue-50 text-blue-700' :
                    state.currentActor === 'DC' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-600'
                  )}>
                    <span>
                      {state.currentActor === 'TA' ? '👤' :
                       state.currentActor === 'DC' ? '🏛️' : '⚙️'}
                    </span>
                    <span>
                      Waiting for <strong>{
                        state.currentActor === 'TA' ? 'Temple Authority' :
                        state.currentActor === 'DC' ? 'District Collector' : 'System'
                      }</strong> to act
                    </span>
                  </div>
                )}

                {!isDcReadOnly && state.availableActions.length > 0 ? (
                  <WorkflowActionPanel
                    workflowInstanceId={workflowInstanceId}
                    lockVersion={state.version}
                    availableActions={state.availableActions}
                    onSuccess={handleSuccess}
                  />
                ) : isDcReadOnly ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    DC Staff can view but cannot take governance actions.
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No actions available in the current state.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'clarification' && (
              <ClarificationInbox
                workflowInstanceId={workflowInstanceId}
                viewerRole={isTa ? 'TA' : 'DC'}
                viewerUserId={viewerUserId ?? 0}
              />
            )}

            {activeTab === 'history' && (
              <WorkflowTimeline workflowInstanceId={workflowInstanceId} />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default WorkflowGovernancePanel
