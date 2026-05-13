/**
 * Types for the Temple Timeline / Audit Trail feature.
 *
 * These mirror the backend TempleTimelineEventResponse record exactly.
 * The frontend maps `eventCode` to display labels, icons, and colours.
 */

/** Broad event category. */
export type TimelineEventType =
  | 'WORKFLOW_TRANSITION'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_DELETE'
  | 'SYSTEM_EVENT'

/**
 * Fine-grained event code — primary driver for UI icon/colour/label lookup.
 * Values match the backend TimelineEventCode enum.
 */
export type TimelineEventCode =
  // Temple Profile
  | 'PROFILE_CREATED'
  | 'PROFILE_SUBMITTED'
  | 'PROFILE_APPROVED'
  | 'PROFILE_REJECTED'
  | 'PROFILE_RESUBMITTED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_UNDER_REVIEW'
  | 'PROFILE_CLARIFICATION_REQUESTED'
  | 'PROFILE_CLARIFICATION_RESPONDED'
  | 'PROFILE_WITHDRAWN'
  // Declaration
  | 'DECLARATION_SUBMITTED'
  | 'DECLARATION_APPROVED'
  | 'DECLARATION_REJECTED'
  | 'DECLARATION_RESUBMITTED'
  | 'DECLARATION_UNDER_REVIEW'
  | 'DECLARATION_CLARIFICATION_REQUESTED'
  | 'DECLARATION_CLARIFICATION_RESPONDED'
  | 'DECLARATION_SITE_VISIT_SCHEDULED'
  | 'DECLARATION_SITE_VISIT_COMPLETED'
  | 'DECLARATION_WITHDRAWN'
  | 'DECLARATION_SUPERSEDED'
  // Trust
  | 'TRUST_SUBMITTED'
  | 'TRUST_APPROVED'
  | 'TRUST_REJECTED'
  | 'TRUST_RESUBMITTED'
  | 'TRUST_UNDER_REVIEW'
  | 'TRUST_CLARIFICATION_REQUESTED'
  | 'TRUST_CLARIFICATION_RESPONDED'
  // Board Member
  | 'BOARD_MEMBER_SUBMITTED'
  | 'BOARD_MEMBER_APPROVED'
  | 'BOARD_MEMBER_REJECTED'
  // Staff
  | 'STAFF_SUBMITTED'
  | 'STAFF_APPROVED'
  | 'STAFF_REJECTED'
  // Contractor
  | 'CONTRACTOR_SUBMITTED'
  | 'CONTRACTOR_APPROVED'
  | 'CONTRACTOR_REJECTED'
  // Documents
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  // System
  | 'SYSTEM_INITIATED'
  | 'SYSTEM_AUTO_SUPERSEDED'
  | 'SYSTEM_ESCALATED'
  | 'SYSTEM_OVERDUE_FLAGGED'
  | 'GENERIC_EVENT'
  | string // allow unknown codes from future backend versions

/** Full timeline event as returned by the API. */
export interface TempleTimelineEventResponse {
  id: number
  templeId: number
  eventType: TimelineEventType
  eventCode: TimelineEventCode
  moduleName: string | null
  entityName: string | null
  title: string
  description: string | null
  metadata: string | null
  referenceId: number | null
  oldStatus: string | null
  newStatus: string | null
  workflowAction: string | null
  performerId: number
  performerName: string | null
  performerRole: string
  comment: string | null
  createdBySystem: boolean
  occurredAt: string // ISO-8601 instant string
}

/** Color / style variant for a timeline event — derived from eventCode. */
export type TimelineEventVariant = 'green' | 'red' | 'blue' | 'orange' | 'purple' | 'slate'

/**
 * Resolve the display variant (colour bucket) for an event code.
 * This is the SINGLE SOURCE OF TRUTH for frontend colour mapping.
 */
export function resolveTimelineVariant(eventCode: TimelineEventCode): TimelineEventVariant {
  if (
    eventCode.endsWith('_APPROVED') ||
    eventCode === 'PROFILE_APPROVED' ||
    eventCode === 'DECLARATION_SITE_VISIT_COMPLETED'
  ) return 'green'

  if (
    eventCode.endsWith('_REJECTED') ||
    eventCode === 'SYSTEM_OVERDUE_FLAGGED'
  ) return 'red'

  if (
    eventCode.endsWith('_SUBMITTED') ||
    eventCode.endsWith('_RESUBMITTED') ||
    eventCode === 'PROFILE_UNDER_REVIEW' ||
    eventCode === 'TRUST_UNDER_REVIEW' ||
    eventCode === 'DECLARATION_UNDER_REVIEW'
  ) return 'blue'

  if (
    eventCode === 'DOCUMENT_UPLOADED' ||
    eventCode === 'DOCUMENT_DELETED'
  ) return 'purple'

  if (
    eventCode === 'PROFILE_UPDATED' ||
    eventCode.endsWith('_CLARIFICATION_REQUESTED') ||
    eventCode.endsWith('_CLARIFICATION_RESPONDED') ||
    eventCode === 'DECLARATION_SITE_VISIT_SCHEDULED' ||
    eventCode === 'PROFILE_WITHDRAWN' ||
    eventCode === 'DECLARATION_WITHDRAWN'
  ) return 'orange'

  return 'slate'
}

/**
 * Friendly display label for a performer role value.
 */
export function resolveRoleLabel(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':          return 'Super Admin'
    case 'DISTRICT_COLLECTOR':   return 'District Collector'
    case 'DC_STAFF':             return 'DC Staff'
    case 'TEMPLE_AUTHORITY':     return 'Temple Authority'
    case 'AUDITOR':              return 'Auditor'
    case 'VIEWER':               return 'Viewer'
    case 'SYSTEM':               return 'System'
    case 'TA':                   return 'Temple Authority'
    case 'DC':                   return 'District Collector'
    default:                     return role
  }
}

/**
 * Group timeline events into display buckets: Today, Yesterday, This Week, Older.
 */
export interface TimelineGroup {
  label: string
  events: TempleTimelineEventResponse[]
}

export function groupTimelineEvents(events: TempleTimelineEventResponse[]): TimelineGroup[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const buckets: Record<string, TempleTimelineEventResponse[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Older': [],
  }

  for (const event of events) {
    const d = new Date(event.occurredAt)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day.getTime() === today.getTime()) {
      buckets['Today'].push(event)
    } else if (day.getTime() === yesterday.getTime()) {
      buckets['Yesterday'].push(event)
    } else if (day >= weekAgo) {
      buckets['This Week'].push(event)
    } else {
      buckets['Older'].push(event)
    }
  }

  return Object.entries(buckets)
    .filter(([, evts]) => evts.length > 0)
    .map(([label, evts]) => ({ label, events: evts }))
}
