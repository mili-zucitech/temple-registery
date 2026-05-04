/**
 * Governance feature public exports.
 * Import from here — never from individual files — for a stable API.
 */
export { WorkflowStatusBadge } from './WorkflowStatusBadge'
export { WorkflowTimeline } from './WorkflowTimeline'
export { WorkflowActionPanel } from './WorkflowActionPanel'
export { ClarificationInbox } from './ClarificationInbox'
export { WorkflowGovernancePanel } from './WorkflowGovernancePanel'
export { useWorkflowSse } from './useWorkflowSse'

// RTK Query hooks
export {
  useGetWorkflowStateQuery,
  useExecuteActionMutation,
  useGetClarificationThreadsQuery,
  useRequestClarificationMutation,
  useRespondToClarificationMutation,
  useResolveThreadMutation,
  useGetWorkflowDashboardQuery,
  useGetPendingCountQuery,
  useGetWorkflowHistoryQuery,
  workflowApi,
} from './workflowApi'

// Types (re-exported from canonical types/workflow.ts)
export type {
  WorkflowStatus,
  WorkflowAction,
  WorkflowEntityType,
  WorkflowInstance,
  WorkflowStateResponse,
  WorkflowTransitionResult,
  AvailableAction,
  ClarificationThread,
  ClarificationMessage,
  ClarificationSummary,
  WorkflowTransitionHistory,
} from '../../types/workflow'

export {
  isApproved,
  isPendingDcAction,
  isPendingTaAction,
  PENDING_DC_STATUSES,
  PENDING_TA_STATUSES,
  TERMINAL_STATUSES,
} from '../../types/workflow'
