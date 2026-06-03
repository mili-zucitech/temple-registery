import type { DeclarationStatus } from './declarationTypes'

export interface ActionVisibility {
  canEdit: boolean
  canSubmit: boolean
  canWithdraw: boolean
  canRespondToClarification: boolean
  canApprove: boolean
  canReject: boolean
  canRequestClarification: boolean
  canScheduleSiteVisit: boolean
  canCompleteSiteVisit: boolean
  canVerify: boolean
}

/**
 * Pure function that determines which actions are available for a declaration
 * based on its current status and the user's role.
 *
 * Rules (Design Property 8):
 * - TA edit/submit: only for DRAFT and REJECTED
 * - TA clarification-respond: only for CLARIFICATION_REQUIRED
 * - TA withdraw: SUBMITTED or CLARIFICATION_REQUIRED (before DC acts)
 * - DC approve: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 * - DC reject: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 * - DC request clarification: SUBMITTED, UNDER_REVIEW
 * - DC schedule site visit: SUBMITTED, UNDER_REVIEW
 * - DC complete site visit: SITE_VISIT_SCHEDULED
 * - DC verify: SITE_VISIT_COMPLETED
 * - All actions disabled for APPROVED, SUPERSEDED, WITHDRAWN, OVERDUE (terminal)
 *
 * @param status - The current declaration status
 * @param userRole - The user's role (TEMPLE_AUTHORITY, DISTRICT_COLLECTOR, SUPER_ADMIN, etc.)
 * @returns ActionVisibility object with boolean flags for each action
 */
export function getAvailableActions(
  status: DeclarationStatus,
  userRole: string
): ActionVisibility {
  const isTA = userRole === 'TEMPLE_AUTHORITY'
  const isDC = userRole === 'DISTRICT_COLLECTOR' || userRole === 'SUPER_ADMIN'

  const noActions: ActionVisibility = {
    canEdit: false,
    canSubmit: false,
    canWithdraw: false,
    canRespondToClarification: false,
    canApprove: false,
    canReject: false,
    canRequestClarification: false,
    canScheduleSiteVisit: false,
    canCompleteSiteVisit: false,
    canVerify: false,
  }

  // Terminal statuses where no further actions are allowed
  if (
    status === 'APPROVED' ||
    status === 'SUPERSEDED' ||
    status === 'WITHDRAWN' ||
    status === 'OVERDUE'
  ) {
    return noActions
  }

  return {
    // TA actions
    canEdit: isTA && (status === 'DRAFT' || status === 'REJECTED'),
    canSubmit: isTA && (status === 'DRAFT' || status === 'REJECTED'),
    canWithdraw: false,
    canRespondToClarification:
      isTA &&
      (status === 'CLARIFICATION_REQUIRED' ||
        status === 'CLARIFICATION_RESPONDED' ||
        status === 'RESUBMITTED'),

    // DC approve: permitted from SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED, RE_APPROVED
    canApprove:
      isDC &&
      (status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW' ||
        status === 'CLARIFICATION_RESPONDED' ||
        status === 'RESUBMITTED' ||
        status === 'VERIFIED' ||
        status === 'RE_APPROVED' ||
        status === 'UPDATED_AFTER_APPROVAL'),

    // DC reject: same statuses as approve
    canReject:
      isDC &&
      (status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW' ||
        status === 'CLARIFICATION_RESPONDED' ||
        status === 'RESUBMITTED' ||
        status === 'VERIFIED' ||
        status === 'RE_APPROVED' ||
        status === 'UPDATED_AFTER_APPROVAL'),

    // DC request clarification: SUBMITTED, UNDER_REVIEW, RESUBMITTED
    canRequestClarification:
      isDC &&
      (status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'RESUBMITTED'),

    // DC site visit flow
    canScheduleSiteVisit: isDC && (status === 'SUBMITTED' || status === 'UNDER_REVIEW'),
    canCompleteSiteVisit: isDC && status === 'SITE_VISIT_SCHEDULED',
    canVerify: isDC && status === 'SITE_VISIT_COMPLETED',
  }
}
