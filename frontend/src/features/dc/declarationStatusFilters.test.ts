import { describe, expect, it } from 'vitest'
import {
  DC_TEMPLE_SEARCH_FILTERS,
  getDeclarationBadgeClass,
  getDeclarationBadgeLabel,
  getDeclarationFilterStatusLabel,
  normalizeDeclarationStatusForDisplay,
} from './declarationStatusFilters'

describe('declarationStatusFilters', () => {
  it('should_returnPendingVerificationLabel_when_filterIsVerificationRequired', () => {
    expect(getDeclarationFilterStatusLabel(DC_TEMPLE_SEARCH_FILTERS.VERIFICATION_REQUIRED))
      .toBe('Pending Verification')
  })

  it('should_returnPendingLabel_when_filterIsPending', () => {
    expect(getDeclarationFilterStatusLabel(DC_TEMPLE_SEARCH_FILTERS.PENDING)).toBe('Pending')
  })

  it('should_normalizeLegacyStatus_when_statusIsPendingReview', () => {
    expect(normalizeDeclarationStatusForDisplay('PENDING_REVIEW')).toBe('SUBMITTED')
  })

  it('should_returnCanonicalBadgeLabel_when_statusIsLegacyClarificationRequested', () => {
    expect(getDeclarationBadgeLabel('CLARIFICATION_REQUESTED')).toBe('Clarification Required')
  })

  it('should_returnCanonicalBadgeClass_when_statusIsLegacyPhysicalVerificationRequested', () => {
    expect(getDeclarationBadgeClass('PHYSICAL_VERIFICATION_REQUESTED'))
      .toContain('bg-indigo-50')
  })
})
