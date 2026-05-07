// ─── Canonical Workflow Types (API v2) ────────────────────────────────────────
// Single source of truth for all workflow state on the frontend.
// Replaces: dcDecisionStatus, submissionStatus, isVerifiedByDc across all modules.

export type WorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'CLARIFICATION_RESPONDED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'RE_APPROVED'
  | 'REJECTED'
  | 'UPDATED_AFTER_APPROVAL'
  | 'SUPERSEDED'
  | 'OVERDUE'
  | 'WITHDRAWN'

export type WorkflowAction =
  | 'SUBMIT'
  | 'RESUBMIT'
  | 'RESPOND_CLARIFICATION'
  | 'WITHDRAW'
  | 'EDIT_APPROVED'
  | 'BEGIN_REVIEW'
  | 'APPROVE'
  | 'RE_APPROVE'
  | 'REJECT'
  | 'REQUEST_CLARIFICATION'
  | 'SEND_BACK'
  | 'SCHEDULE_SITE_VISIT'
  | 'COMPLETE_SITE_VISIT'
  | 'VERIFY_SITE_VISIT'
  | 'FAIL_SITE_VISIT'
  | 'FLAG_OVERDUE'
  | 'ESCALATE'

export type WorkflowEntityType =
  | 'TEMPLE_PROFILE'
  | 'DECLARATION'
  | 'TRUST'
  | 'BOARD_MEMBER'

// ─── Workflow Instance ────────────────────────────────────────────────────────

export interface WorkflowInstance {
  id: number
  entityType: WorkflowEntityType
  entityId: number
  status: WorkflowStatus
  subStatus?: string
  lockVersion: number
  versionNumber: number
  currentActorRole?: 'TA' | 'DC' | 'SYSTEM' | 'SUPER_ADMIN'
  createdByUserId: number
  templeId: number
  districtId: number
  deadlineAt?: string
  submittedAt?: string
  statusUpdatedAt?: string
  metadataJson?: string
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export interface AvailableAction {
  action: WorkflowAction
  label: string
  requiresComment: boolean
  requiresVersion: boolean
  confirmationMessage?: string
}

export interface WorkflowActionRequest {
  action: WorkflowAction
  expectedVersion?: number
  idempotencyKey?: string
  comment?: string
}

export interface WorkflowTransitionResult {
  workflowInstanceId: number
  newStatus: WorkflowStatus
  newSubStatus?: string
  newVersion: number
  availableActions: AvailableAction[]
  cached: boolean
}

// ─── Workflow State (GET response) ───────────────────────────────────────────

export interface WorkflowStateResponse {
  instanceId: number
  entityType: WorkflowEntityType
  status: WorkflowStatus
  subStatus?: string
  version: number
  currentActor?: string
  availableActions: AvailableAction[]
  clarification?: ClarificationSummary
}

// ─── Workflow Envelope (API v2) ──────────────────────────────────────────────

/**
 * Unified response envelope for module-specific data (Trust, Declaration, etc.)
 * merged with its governance state.
 */
export interface WorkflowEnvelope<T> {
  /** The pure domain data (e.g., TrustResponse, DeclarationResponse). */
  data: T
  /** The governance state machien context. */
  workflow: WorkflowSummary
  /** Clarification context. */
  clarification?: ClarificationSummary
  /** Notification badge context (optional). */
  notifications?: {
    unreadCount: number
    latestMessage?: string
  }
}

export interface WorkflowSummary {
  instanceId: number
  entityType: WorkflowEntityType
  status: WorkflowStatus
  subStatus?: string
  version: number
  currentActor: string
  submittedAt?: string
  statusUpdatedAt?: string
  deadlineAt?: string
  availableActions: AvailableAction[]
  hasUnapprovedChanges: boolean
}

// ─── Clarification ────────────────────────────────────────────────────────────

export interface ClarificationSummary {
  totalRounds: number
  activeThreads: number
  lastRoundStatus?: string
  lastRequestedAt?: string
  lastRespondedAt?: string
}

export interface ClarificationThread {
  id: number
  roundNumber: number
  status: 'OPEN' | 'RESPONDED' | 'RESOLVED' | 'EXPIRED' | 'ESCALATED'
  requestedBy: number
  requestedAt: string
  respondedBy?: number
  respondedAt?: string
  resolvedAt?: string
  escalationLevel: number
  messages: ClarificationMessage[]
}

export interface ClarificationMessage {
  id: number
  direction: 'DC_TO_TA' | 'TA_TO_DC'
  authorId: number
  message: string
  sectionName?: string
  fieldNames?: string[]
  createdAtInstant: string
  attachments?: ClarificationAttachment[]
}

export interface ClarificationAttachment {
  id: number
  filePath: string
  fileName: string
  fileSizeBytes?: number
  contentType?: string
}

// ─── Workflow Audit ───────────────────────────────────────────────────────────

export interface WorkflowTransitionHistory {
  id: number
  fromStatus?: WorkflowStatus
  toStatus: WorkflowStatus
  fromSubStatus?: string
  toSubStatus?: string
  action: WorkflowAction
  actorId: number
  actorRole?: string
  comment?: string
  performedAt: string
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const PENDING_DC_STATUSES: WorkflowStatus[] = [
  'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED', 'RESUBMITTED'
]

export const PENDING_TA_STATUSES: WorkflowStatus[] = [
  'CLARIFICATION_REQUESTED', 'UPDATED_AFTER_APPROVAL', 'REJECTED'
]

export const TERMINAL_STATUSES: WorkflowStatus[] = [
  'APPROVED', 'RE_APPROVED', 'REJECTED', 'SUPERSEDED', 'WITHDRAWN'
]

export const isApproved = (status: WorkflowStatus) =>
  status === 'APPROVED' || status === 'RE_APPROVED'

export const isPendingDcAction = (status: WorkflowStatus) =>
  PENDING_DC_STATUSES.includes(status)

export const isPendingTaAction = (status: WorkflowStatus) =>
  PENDING_TA_STATUSES.includes(status)

// ─── Governance Status Payload ────────────────────────────────────────────────
// Canonical status object embedded in all governed entity API responses.
// Replaces: dcDecisionStatus, submissionStatus, isVerifiedByDc, dcFlagReason.

export interface GovernanceStatusPayload {
  status: WorkflowStatus
  subStatus?: string
  label: string
  severity: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO'
  actionableBy?: 'DC' | 'TA' | 'SYSTEM' | null
  requiresComment: boolean
  pendingSince?: string
  deadline?: string
  workflowInstanceId?: number
<<<<<<< HEAD
=======
  /**
   * Actions the actionableBy role may perform from this state.
   * Derived from TransitionRuleRegistry on the backend.
   * Frontend must use this to decide which action buttons to render.
   */
  allowedActions?: string[]
  /** Populated when status = REJECTED — reason given by DC */
  rejectionReason?: string | null
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
}
