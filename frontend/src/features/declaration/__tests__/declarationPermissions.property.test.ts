// Feature: asset-declaration-complete, Property 8: Frontend Button Visibility

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { getAvailableActions } from '../declarationPermissions'
import { DECLARATION_STATUSES } from '../declarationTypes'
import type { DeclarationStatus } from '../declarationTypes'

/**
 * Property 8: Frontend Button Visibility
 *
 * For any DeclarationStatus value, getAvailableActions(status, userRole) must return
 * a button-visibility map consistent with the following rules:
 *
 * TA rules:
 *   - edit/submit enabled ONLY for DRAFT
 *   - clarification-respond enabled ONLY for CLARIFICATION_REQUIRED
 *
 * DC rules:
 *   - approve: enabled for SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 *   - reject: enabled for SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
 *   - request clarification: enabled for SUBMITTED, UNDER_REVIEW
 *   - schedule site visit: enabled for SUBMITTED, UNDER_REVIEW
 *   - complete site visit: enabled for SITE_VISIT_SCHEDULED
 *   - verify: enabled for SITE_VISIT_COMPLETED
 *
 * Terminal statuses (ALL actions disabled):
 *   - APPROVED, REJECTED, SUPERSEDED
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5
 */

const TA_ROLE = 'TEMPLE_AUTHORITY'
const DC_ROLE = 'DISTRICT_COLLECTOR'

const TERMINAL_STATUSES: DeclarationStatus[] = ['APPROVED', 'REJECTED', 'SUPERSEDED']

const DC_APPROVE_REJECT_STATUSES: DeclarationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CLARIFICATION_RESPONDED',
  'VERIFIED',
]

const DC_CLARIFY_SITE_VISIT_STATUSES: DeclarationStatus[] = ['SUBMITTED', 'UNDER_REVIEW']

describe('Property 8: getAvailableActions button visibility', () => {
  it('should return correct visibility for all status × role combinations (min 100 runs)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DECLARATION_STATUSES),
        fc.constantFrom(TA_ROLE, DC_ROLE),
        (status: DeclarationStatus, role: string) => {
          const actions = getAvailableActions(status, role)
          const isTA = role === TA_ROLE
          const isDC = role === DC_ROLE
          const isTerminal = TERMINAL_STATUSES.includes(status)

          // ─── Terminal statuses: ALL actions must be disabled ───────────────
          if (isTerminal) {
            expect(actions.canEdit, `canEdit should be false for terminal status ${status}`).toBe(false)
            expect(actions.canSubmit, `canSubmit should be false for terminal status ${status}`).toBe(false)
            expect(actions.canRespondToClarification, `canRespondToClarification should be false for terminal status ${status}`).toBe(false)
            expect(actions.canApprove, `canApprove should be false for terminal status ${status}`).toBe(false)
            expect(actions.canReject, `canReject should be false for terminal status ${status}`).toBe(false)
            expect(actions.canRequestClarification, `canRequestClarification should be false for terminal status ${status}`).toBe(false)
            expect(actions.canScheduleSiteVisit, `canScheduleSiteVisit should be false for terminal status ${status}`).toBe(false)
            expect(actions.canCompleteSiteVisit, `canCompleteSiteVisit should be false for terminal status ${status}`).toBe(false)
            expect(actions.canVerify, `canVerify should be false for terminal status ${status}`).toBe(false)
            return
          }

          // ─── TA rules ──────────────────────────────────────────────────────
          // edit/submit: enabled ONLY for DRAFT
          expect(actions.canEdit, `canEdit for TA, status=${status}`).toBe(isTA && status === 'DRAFT')
          expect(actions.canSubmit, `canSubmit for TA, status=${status}`).toBe(isTA && status === 'DRAFT')

          // clarification-respond: enabled ONLY for CLARIFICATION_REQUIRED
          expect(
            actions.canRespondToClarification,
            `canRespondToClarification for TA, status=${status}`,
          ).toBe(isTA && status === 'CLARIFICATION_REQUIRED')

          // ─── DC rules ──────────────────────────────────────────────────────
          // approve: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
          expect(actions.canApprove, `canApprove for DC, status=${status}`).toBe(
            isDC && DC_APPROVE_REJECT_STATUSES.includes(status),
          )

          // reject: SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED
          expect(actions.canReject, `canReject for DC, status=${status}`).toBe(
            isDC && DC_APPROVE_REJECT_STATUSES.includes(status),
          )

          // request clarification: SUBMITTED, UNDER_REVIEW
          expect(actions.canRequestClarification, `canRequestClarification for DC, status=${status}`).toBe(
            isDC && DC_CLARIFY_SITE_VISIT_STATUSES.includes(status),
          )

          // schedule site visit: SUBMITTED, UNDER_REVIEW
          expect(actions.canScheduleSiteVisit, `canScheduleSiteVisit for DC, status=${status}`).toBe(
            isDC && DC_CLARIFY_SITE_VISIT_STATUSES.includes(status),
          )

          // complete site visit: SITE_VISIT_SCHEDULED only
          expect(actions.canCompleteSiteVisit, `canCompleteSiteVisit for DC, status=${status}`).toBe(
            isDC && status === 'SITE_VISIT_SCHEDULED',
          )

          // verify: SITE_VISIT_COMPLETED only
          expect(actions.canVerify, `canVerify for DC, status=${status}`).toBe(
            isDC && status === 'SITE_VISIT_COMPLETED',
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  // ─── Deterministic spot-checks for key rules ──────────────────────────────

  it('TA: edit and submit are enabled only for DRAFT', () => {
    const draft = getAvailableActions('DRAFT', TA_ROLE)
    expect(draft.canEdit).toBe(true)
    expect(draft.canSubmit).toBe(true)

    for (const status of DECLARATION_STATUSES.filter((s) => s !== 'DRAFT')) {
      const actions = getAvailableActions(status, TA_ROLE)
      expect(actions.canEdit, `canEdit should be false for TA with status=${status}`).toBe(false)
      expect(actions.canSubmit, `canSubmit should be false for TA with status=${status}`).toBe(false)
    }
  })

  it('TA: clarification-respond is enabled only for CLARIFICATION_REQUIRED', () => {
    const clarReq = getAvailableActions('CLARIFICATION_REQUIRED', TA_ROLE)
    expect(clarReq.canRespondToClarification).toBe(true)

    for (const status of DECLARATION_STATUSES.filter((s) => s !== 'CLARIFICATION_REQUIRED')) {
      const actions = getAvailableActions(status, TA_ROLE)
      expect(
        actions.canRespondToClarification,
        `canRespondToClarification should be false for TA with status=${status}`,
      ).toBe(false)
    }
  })

  it('DC: approve and reject are enabled for SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, VERIFIED', () => {
    for (const status of DC_APPROVE_REJECT_STATUSES) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canApprove, `canApprove should be true for DC with status=${status}`).toBe(true)
      expect(actions.canReject, `canReject should be true for DC with status=${status}`).toBe(true)
    }

    for (const status of DECLARATION_STATUSES.filter((s) => !DC_APPROVE_REJECT_STATUSES.includes(s))) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canApprove, `canApprove should be false for DC with status=${status}`).toBe(false)
      expect(actions.canReject, `canReject should be false for DC with status=${status}`).toBe(false)
    }
  })

  it('DC: request clarification and schedule site visit are enabled only for SUBMITTED, UNDER_REVIEW', () => {
    for (const status of DC_CLARIFY_SITE_VISIT_STATUSES) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canRequestClarification, `canRequestClarification should be true for DC with status=${status}`).toBe(true)
      expect(actions.canScheduleSiteVisit, `canScheduleSiteVisit should be true for DC with status=${status}`).toBe(true)
    }

    for (const status of DECLARATION_STATUSES.filter((s) => !DC_CLARIFY_SITE_VISIT_STATUSES.includes(s))) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canRequestClarification, `canRequestClarification should be false for DC with status=${status}`).toBe(false)
      expect(actions.canScheduleSiteVisit, `canScheduleSiteVisit should be false for DC with status=${status}`).toBe(false)
    }
  })

  it('DC: complete site visit is enabled only for SITE_VISIT_SCHEDULED', () => {
    const scheduled = getAvailableActions('SITE_VISIT_SCHEDULED', DC_ROLE)
    expect(scheduled.canCompleteSiteVisit).toBe(true)

    for (const status of DECLARATION_STATUSES.filter((s) => s !== 'SITE_VISIT_SCHEDULED')) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canCompleteSiteVisit, `canCompleteSiteVisit should be false for DC with status=${status}`).toBe(false)
    }
  })

  it('DC: verify is enabled only for SITE_VISIT_COMPLETED', () => {
    const completed = getAvailableActions('SITE_VISIT_COMPLETED', DC_ROLE)
    expect(completed.canVerify).toBe(true)

    for (const status of DECLARATION_STATUSES.filter((s) => s !== 'SITE_VISIT_COMPLETED')) {
      const actions = getAvailableActions(status, DC_ROLE)
      expect(actions.canVerify, `canVerify should be false for DC with status=${status}`).toBe(false)
    }
  })

  it('ALL actions are disabled for terminal statuses (APPROVED, REJECTED, SUPERSEDED)', () => {
    for (const status of TERMINAL_STATUSES) {
      for (const role of [TA_ROLE, DC_ROLE]) {
        const actions = getAvailableActions(status, role)
        expect(actions.canEdit, `canEdit should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canSubmit, `canSubmit should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canRespondToClarification, `canRespondToClarification should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canApprove, `canApprove should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canReject, `canReject should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canRequestClarification, `canRequestClarification should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canScheduleSiteVisit, `canScheduleSiteVisit should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canCompleteSiteVisit, `canCompleteSiteVisit should be false for ${role} with terminal status=${status}`).toBe(false)
        expect(actions.canVerify, `canVerify should be false for ${role} with terminal status=${status}`).toBe(false)
      }
    }
  })
})
