import { z } from 'zod'

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Layer 1: Submission Status — visible to ALL roles.
 * Drives the Temple Authority workflow.
 */
export const SUBMISSION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'SENT_BACK',
  'APPROVED',
  'REJECTED',
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

/**
 * Layer 3: DC Decision Status — visible to ALL roles.
 */
export const DC_DECISION_STATUSES = [
  'PENDING_DC_APPROVAL',
  'APPROVED_BY_DC',
  'REJECTED_BY_DC',
] as const
export type DcDecisionStatus = (typeof DC_DECISION_STATUSES)[number]

/**
 * Physical Verification Status — ASSET DECLARATIONS ONLY.
 * DC-ONLY. Never shown to Temple Authority.
 */
export const PHYSICAL_VERIFICATION_STATUSES = [
  'NOT_INITIATED',
  'ORDERED_FOR_PHYSICAL_VERIFICATION',
  'PHYSICALLY_VERIFIED',
  'VERIFICATION_FAILED',
] as const
export type PhysicalVerificationStatus = (typeof PHYSICAL_VERIFICATION_STATUSES)[number]

// ─── Request schemas ──────────────────────────────────────────────────────────

/**
 * Send Back request — free-text reason is MANDATORY.
 * No dropdowns. DC must provide a clear explanation.
 */
export const sendBackSchema = z.object({
  reason: z
    .string()
    .min(10, 'Send back reason must be at least 10 characters.')
    .max(2000, 'Reason cannot exceed 2000 characters.')
    .refine((v) => v.trim().length >= 10, {
      message: 'Send back reason must contain meaningful text (at least 10 characters).',
    }),
})
export type SendBackRequest = z.infer<typeof sendBackSchema>

/**
 * Reject request — reason is MANDATORY.
 * Rejection is terminal — TA must create a new submission.
 */
export const rejectSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters.')
    .max(2000, 'Reason cannot exceed 2000 characters.')
    .refine((v) => v.trim().length >= 10, {
      message: 'Rejection reason must contain meaningful text (at least 10 characters).',
    }),
})
export type RejectRequest = z.infer<typeof rejectSchema>

/**
 * Approve declaration request — remarks are optional.
 */
export const workflowApproveSchema = z.object({
  remarks: z.string().max(2000, 'Remarks cannot exceed 2000 characters.').optional(),
})
export type WorkflowApproveRequest = z.infer<typeof workflowApproveSchema>

/**
 * Reject declaration request — remarks are MANDATORY.
 */
export const workflowRejectSchema = z.object({
  remarks: z
    .string()
    .min(10, 'Rejection remarks must be at least 10 characters.')
    .max(2000, 'Remarks cannot exceed 2000 characters.')
    .refine((v) => v.trim().length >= 10, {
      message: 'Rejection remarks must contain meaningful text (at least 10 characters).',
    }),
})
export type WorkflowRejectRequest = z.infer<typeof workflowRejectSchema>

/**
 * Clarify declaration request — message is MANDATORY.
 * Section name and field names are optional for targeting specific data.
 */
export const dcClarifySchema = z.object({
  message: z
    .string()
    .min(10, 'Clarification message must be at least 10 characters.')
    .max(2000, 'Message cannot exceed 2000 characters.')
    .refine((v) => v.trim().length >= 10, {
      message: 'Clarification message must contain meaningful text (at least 10 characters).',
    }),
  sectionName: z.string().max(100, 'Section name cannot exceed 100 characters.').optional(),
  fieldNames: z.array(z.string()).optional(),
})
export type DcClarifyRequest = z.infer<typeof dcClarifySchema>

/**
 * Order Physical Verification request — notes are optional.
 */
export const orderPhysicalVerificationSchema = z.object({
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters.').optional(),
})
export type OrderPhysicalVerificationRequest = z.infer<typeof orderPhysicalVerificationSchema>

/**
 * Update Physical Verification request.
 * Allowed new statuses: PHYSICALLY_VERIFIED or VERIFICATION_FAILED.
 */
export const updatePhysicalVerificationSchema = z.object({
  newStatus: z.enum(['PHYSICALLY_VERIFIED', 'VERIFICATION_FAILED']),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters.').optional(),
})
export type UpdatePhysicalVerificationRequest = z.infer<typeof updatePhysicalVerificationSchema>

// ─── Response types ───────────────────────────────────────────────────────────

/**
 * Governance status view for Temple Authority.
 * Applies to TRUST and ASSET DECLARATION only.
 * Contains ONLY submissionStatus, dcDecisionStatus, and sendBackReason.
 * systemVerificationStatus and physicalVerificationStatus are EXCLUDED.
 */
export interface GovernanceStatusResponse {
  submissionStatus: SubmissionStatus
  dcDecisionStatus: DcDecisionStatus
  /** Free-text reason from DC when status is SENT_BACK. Null otherwise. */
  sendBackReason?: string | null
}

/**
 * Full governance status view for DC and DC Staff.
 * Contains all 3 layers plus physical verification status (declarations only).
 * MUST NEVER be shown to Temple Authority.
 */
export interface DcGovernanceStatusResponse extends GovernanceStatusResponse {
  /** Layer 2 — INTERNAL, DC-only */
  systemVerificationStatus?: string | null
  /** Physical verification status — declarations only, DC-only */
  physicalVerificationStatus?: PhysicalVerificationStatus | null
  physicalVerificationOrderedAt?: string | null
  physicalVerificationOrderedBy?: number | null
  physicalVerificationCompletedAt?: string | null
}

/**
 * Physical verification history entry — DC-only.
 * MUST NEVER be shown to Temple Authority.
 */
export interface PhysicalVerificationHistoryEntry {
  id: number
  declarationId: number
  dcUserId: number
  previousStatus: PhysicalVerificationStatus
  newStatus: PhysicalVerificationStatus
  notes?: string | null
  occurredAt: string
}

/**
 * Workflow action response — returned by approve/reject/clarify/flag-physical actions.
 */
export interface WorkflowActionResponse {
  declarationId: number
  newStatus: string
  acknowledgementNumber?: string | null
  message: string
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

/** Human-readable labels for submission statuses. */
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  SENT_BACK: 'Sent Back',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

/** Tailwind badge color classes for submission statuses. */
export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  SENT_BACK: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}

/** Human-readable labels for DC decision statuses. */
export const DC_DECISION_STATUS_LABELS: Record<DcDecisionStatus, string> = {
  PENDING_DC_APPROVAL: 'Pending DC Approval',
  APPROVED_BY_DC: 'Approved by DC',
  REJECTED_BY_DC: 'Rejected by DC',
}

/** Human-readable labels for physical verification statuses. */
export const PHYSICAL_VERIFICATION_STATUS_LABELS: Record<PhysicalVerificationStatus, string> = {
  NOT_INITIATED: 'Not Initiated',
  ORDERED_FOR_PHYSICAL_VERIFICATION: 'Ordered for Physical Verification',
  PHYSICALLY_VERIFIED: 'Physically Verified',
  VERIFICATION_FAILED: 'Verification Failed',
}

/** Tailwind badge color classes for physical verification statuses. */
export const PHYSICAL_VERIFICATION_STATUS_COLORS: Record<PhysicalVerificationStatus, string> = {
  NOT_INITIATED: 'bg-gray-100 text-gray-600',
  ORDERED_FOR_PHYSICAL_VERIFICATION: 'bg-blue-100 text-blue-700',
  PHYSICALLY_VERIFIED: 'bg-green-100 text-green-700',
  VERIFICATION_FAILED: 'bg-red-100 text-red-700',
}

/**
 * Returns true if a Temple Authority can edit a record with the given submission status.
 * REJECTED records cannot be edited — TA must create a new one.
 * SUBMITTED and APPROVED records cannot be edited — TA must wait for DC action.
 */
export function canTaEdit(submissionStatus: SubmissionStatus): boolean {
  return submissionStatus === 'DRAFT' || submissionStatus === 'SENT_BACK'
}

/**
 * Returns true if a Temple Authority can submit a record.
 * Only DRAFT and SENT_BACK records can be submitted.
 */
export function canTaSubmit(submissionStatus: SubmissionStatus): boolean {
  return submissionStatus === 'DRAFT' || submissionStatus === 'SENT_BACK'
}

/**
 * Returns true if DC can act on a record (approve/send-back/reject).
 * Only SUBMITTED records can be acted upon.
 */
export function canDcAct(submissionStatus: SubmissionStatus): boolean {
  return submissionStatus === 'SUBMITTED'
}

/**
 * Returns true if DC can approve a declaration.
 * Blocked if physical verification has FAILED.
 */
export function canDcApproveDeclaration(
  submissionStatus: SubmissionStatus,
  physicalVerificationStatus?: PhysicalVerificationStatus | null,
): boolean {
  if (!canDcAct(submissionStatus)) return false
  if (physicalVerificationStatus === 'VERIFICATION_FAILED') return false
  return true
}