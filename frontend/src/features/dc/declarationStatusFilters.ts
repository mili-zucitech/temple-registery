import type { DeclarationStatus as AssetDeclarationStatus } from '@/features/declaration/declarationTypes'

export const DC_TEMPLE_SEARCH_FILTERS = {
  NO_DECLARATION: 'NO_DECLARATION',
  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
  APPROVED: 'APPROVED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'CLARIFICATION_REQUIRED',
  CLARIFICATION_RESPONDED: 'CLARIFICATION_RESPONDED',
  SUBMITTED: 'SUBMITTED',
  SITE_VISIT_SCHEDULED: 'SITE_VISIT_SCHEDULED',
  SITE_VISIT_COMPLETED: 'SITE_VISIT_COMPLETED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  DRAFT: 'DRAFT',
  SUPERSEDED: 'SUPERSEDED',
  WITHDRAWN: 'WITHDRAWN',
  PENDING_REVIEW: 'PENDING_REVIEW',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUESTED',
  PHYSICAL_VERIFICATION_REQUESTED: 'PHYSICAL_VERIFICATION_REQUESTED',
  RESUBMITTED: 'RESUBMITTED',
} as const

export const DC_DECLARATION_FILTER_STATUSES = [
  DC_TEMPLE_SEARCH_FILTERS.NO_DECLARATION,
  DC_TEMPLE_SEARCH_FILTERS.VERIFICATION_REQUIRED,
  DC_TEMPLE_SEARCH_FILTERS.PENDING,
  DC_TEMPLE_SEARCH_FILTERS.OVERDUE,
  DC_TEMPLE_SEARCH_FILTERS.APPROVED,
  DC_TEMPLE_SEARCH_FILTERS.UNDER_REVIEW,
  DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_REQUIRED,
  DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_RESPONDED,
  DC_TEMPLE_SEARCH_FILTERS.SUBMITTED,
  DC_TEMPLE_SEARCH_FILTERS.SITE_VISIT_SCHEDULED,
  DC_TEMPLE_SEARCH_FILTERS.SITE_VISIT_COMPLETED,
  DC_TEMPLE_SEARCH_FILTERS.VERIFIED,
  DC_TEMPLE_SEARCH_FILTERS.REJECTED,
  DC_TEMPLE_SEARCH_FILTERS.DRAFT,
  DC_TEMPLE_SEARCH_FILTERS.SUPERSEDED,
  DC_TEMPLE_SEARCH_FILTERS.WITHDRAWN,
  DC_TEMPLE_SEARCH_FILTERS.PENDING_REVIEW,
  DC_TEMPLE_SEARCH_FILTERS.CLARIFICATION_REQUESTED,
  DC_TEMPLE_SEARCH_FILTERS.PHYSICAL_VERIFICATION_REQUESTED,
  DC_TEMPLE_SEARCH_FILTERS.RESUBMITTED,
] as const

export type DcDeclarationFilterStatus = (typeof DC_DECLARATION_FILTER_STATUSES)[number]

type LegacyDeclarationStatus =
  | 'PENDING_REVIEW'
  | 'RESUBMITTED'
  | 'CLARIFICATION_REQUESTED'
  | 'PHYSICAL_VERIFICATION_REQUESTED'

const LEGACY_TO_CANONICAL_STATUS: Record<LegacyDeclarationStatus, AssetDeclarationStatus> = {
  PENDING_REVIEW: 'SUBMITTED',
  RESUBMITTED: 'SUBMITTED',
  CLARIFICATION_REQUESTED: 'CLARIFICATION_REQUIRED',
  PHYSICAL_VERIFICATION_REQUESTED: 'SITE_VISIT_SCHEDULED',
}

const FILTER_LABELS: Record<DcDeclarationFilterStatus, string> = {
  NO_DECLARATION: 'No Declaration',
  VERIFICATION_REQUIRED: 'Pending Verification',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
  APPROVED: 'Declared',
  UNDER_REVIEW: 'Under Review',
  CLARIFICATION_REQUIRED: 'Clarification Required',
  CLARIFICATION_RESPONDED: 'Clarification Responded',
  SUBMITTED: 'Submitted',
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Completed',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
  SUPERSEDED: 'Superseded',
  WITHDRAWN: 'Withdrawn',
  PENDING_REVIEW: 'Pending',
  CLARIFICATION_REQUESTED: 'Clarification Required',
  PHYSICAL_VERIFICATION_REQUESTED: 'Pending Verification',
  RESUBMITTED: 'Resubmitted',
}

const BADGE_LABELS: Record<AssetDeclarationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  CLARIFICATION_REQUIRED: 'Clarification Required',
  CLARIFICATION_RESPONDED: 'Clarification Responded',
  RESUBMITTED: 'Resubmitted',
  SITE_VISIT_SCHEDULED: 'Site Visit Scheduled',
  SITE_VISIT_COMPLETED: 'Site Visit Completed',
  VERIFIED: 'Verified',
  APPROVED: 'Declared',
  REJECTED: 'Rejected',
  OVERDUE: 'Overdue',
  SUPERSEDED: 'Superseded',
  WITHDRAWN: 'Withdrawn',
  RE_APPROVED: 'Re-Approved',
  UPDATED_AFTER_APPROVAL: 'Updated After Approval',
}

const BADGE_CLASSES: Record<AssetDeclarationStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SUBMITTED: 'bg-blue-50 text-blue-800 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  CLARIFICATION_REQUIRED: 'bg-violet-50 text-violet-800 border-violet-200',
  CLARIFICATION_RESPONDED: 'bg-sky-50 text-sky-800 border-sky-200',
  RESUBMITTED: 'bg-sky-50 text-sky-800 border-sky-200',
  SITE_VISIT_SCHEDULED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  SITE_VISIT_COMPLETED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  VERIFIED: 'bg-teal-50 text-teal-800 border-teal-200',
  APPROVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-800 border-rose-200',
  OVERDUE: 'bg-red-50 text-red-800 border-red-200',
  SUPERSEDED: 'bg-slate-100 text-slate-700 border-slate-300',
  WITHDRAWN: 'bg-slate-100 text-slate-700 border-slate-300',
  RE_APPROVED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  UPDATED_AFTER_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

export function getDeclarationFilterStatusLabel(status: string | null | undefined): string {
  if (!status) return 'All'
  const normalized = status.trim().toUpperCase() as DcDeclarationFilterStatus
  return FILTER_LABELS[normalized] ?? normalized.replace(/_/g, ' ')
}

export function normalizeDeclarationStatusForDisplay(
  status: string | null | undefined,
): AssetDeclarationStatus | null {
  if (!status) return null
  const normalized = status.trim().toUpperCase() as AssetDeclarationStatus | LegacyDeclarationStatus
  return LEGACY_TO_CANONICAL_STATUS[normalized as LegacyDeclarationStatus] ?? normalized
}

export function getDeclarationBadgeLabel(status: string | null | undefined): string {
  const normalized = normalizeDeclarationStatusForDisplay(status)
  if (!normalized) return 'No declaration'
  return BADGE_LABELS[normalized] ?? normalized.replace(/_/g, ' ')
}

export function getDeclarationBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeDeclarationStatusForDisplay(status)
  if (!normalized) return 'bg-muted text-muted-foreground border-border'
  return BADGE_CLASSES[normalized] ?? 'bg-muted text-muted-foreground border-border'
}
