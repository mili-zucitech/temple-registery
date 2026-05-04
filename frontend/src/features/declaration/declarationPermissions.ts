import type { DeclarationStatus } from './declarationTypes'

export interface ActionVisibility {
  canEdit: boolean
  canSubmit: boolean
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
 * - DC approve: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 * - DC reject: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 * - DC request clarification: SUBMITTED, UNDER_REVIEW
 * - DC schedule site visit: SUBMITTED, UNDER_REVIEW
 * - DC complete site visit: SITE_VISIT_SCHEDULED
 * - DC verify: SITE_VISIT_COMPLETED
 * - All actions disabled for APPROVED, SUPERSEDED
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

  // Terminal statuses where no actions are allowed (except REJECTED which can be edited)
  const isTerminal = status === 'APPROVED' || status === 'SUPERSEDED'

  if (isTerminal) {
    return {
      canEdit: false,
      canSubmit: false,
      canRespondToClarification: false,
      canApprove: false,
      canReject: false,
      canRequestClarification: false,
      canScheduleSiteVisit: false,
      canCompleteSiteVisit: false,
      canVerify: false,
    }
  }

  return {
    // TA actions - allow edit and submit for both DRAFT and REJECTED
    canEdit: isTA && (status === 'DRAFT' || status === 'REJECTED'),
    canSubmit: isTA && (status === 'DRAFT' || status === 'REJECTED'),
    canRespondToClarification: isTA && status === 'CLARIFICATION_REQUIRED',

    // DC approve: permitted from SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
    // (per state machine: these statuses have APPROVED as a valid next state)
    canApprove:
      isDC &&
      (status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW' ||
        status === 'CLARIFICATION_RESPONDED' ||
        status === 'VERIFIED'),

    // DC reject: permitted from SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
    // (per state machine: these statuses have REJECTED as a valid next state)
    canReject:
      isDC &&
      (status === 'SUBMITTED' ||
        status === 'UNDER_REVIEW' ||
        status === 'CLARIFICATION_RESPONDED' ||
        status === 'VERIFIED'),

    // DC request clarification: only from SUBMITTED or UNDER_REVIEW
    canRequestClarification: isDC && (status === 'SUBMITTED' || status === 'UNDER_REVIEW'),

    // DC site visit flow
    canScheduleSiteVisit: isDC && (status === 'SUBMITTED' || status === 'UNDER_REVIEW'),
    canCompleteSiteVisit: isDC && status === 'SITE_VISIT_SCHEDULED',
    canVerify: isDC && status === 'SITE_VISIT_COMPLETED',
  }
}
