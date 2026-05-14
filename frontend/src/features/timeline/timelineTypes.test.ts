import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  resolveTimelineVariant,
  resolveRoleLabel,
  groupTimelineEvents,
  type TempleTimelineEventResponse,
} from './timelineTypes'

// ─── resolveTimelineVariant ────────────────────────────────────────────────────

describe('resolveTimelineVariant', () => {
  it('should_return_green_for_approved_codes', () => {
    expect(resolveTimelineVariant('PROFILE_APPROVED')).toBe('green')
    expect(resolveTimelineVariant('DECLARATION_APPROVED')).toBe('green')
    expect(resolveTimelineVariant('TRUST_APPROVED')).toBe('green')
  })

  it('should_return_red_for_rejected_codes', () => {
    expect(resolveTimelineVariant('PROFILE_REJECTED')).toBe('red')
    expect(resolveTimelineVariant('DECLARATION_REJECTED')).toBe('red')
    expect(resolveTimelineVariant('SYSTEM_OVERDUE_FLAGGED')).toBe('red')
  })

  it('should_return_blue_for_submitted_codes', () => {
    expect(resolveTimelineVariant('PROFILE_SUBMITTED')).toBe('blue')
    expect(resolveTimelineVariant('DECLARATION_RESUBMITTED')).toBe('blue')
    expect(resolveTimelineVariant('PROFILE_UNDER_REVIEW')).toBe('blue')
  })

  it('should_return_purple_for_document_codes', () => {
    expect(resolveTimelineVariant('DOCUMENT_UPLOADED')).toBe('purple')
    expect(resolveTimelineVariant('DOCUMENT_DELETED')).toBe('purple')
  })

  it('should_return_orange_for_clarification_codes', () => {
    expect(resolveTimelineVariant('PROFILE_CLARIFICATION_REQUESTED')).toBe('orange')
    expect(resolveTimelineVariant('DECLARATION_CLARIFICATION_RESPONDED')).toBe('orange')
    expect(resolveTimelineVariant('PROFILE_UPDATED')).toBe('orange')
  })

  it('should_return_slate_for_unknown_codes', () => {
    expect(resolveTimelineVariant('GENERIC_EVENT')).toBe('slate')
    expect(resolveTimelineVariant('SYSTEM_INITIATED')).toBe('slate')
  })
})

// ─── resolveRoleLabel ─────────────────────────────────────────────────────────

describe('resolveRoleLabel', () => {
  it('should_return_friendly_label_for_known_roles', () => {
    expect(resolveRoleLabel('DISTRICT_COLLECTOR')).toBe('District Collector')
    expect(resolveRoleLabel('TEMPLE_AUTHORITY')).toBe('Temple Authority')
    expect(resolveRoleLabel('SUPER_ADMIN')).toBe('Super Admin')
    expect(resolveRoleLabel('SYSTEM')).toBe('System')
    expect(resolveRoleLabel('DC')).toBe('District Collector')
    expect(resolveRoleLabel('TA')).toBe('Temple Authority')
  })

  it('should_return_raw_value_for_unknown_role', () => {
    expect(resolveRoleLabel('UNKNOWN_ROLE')).toBe('UNKNOWN_ROLE')
  })
})

// ─── groupTimelineEvents ──────────────────────────────────────────────────────

describe('groupTimelineEvents', () => {
  const makeEvent = (occurredAt: string): TempleTimelineEventResponse => ({
    id: Math.random(),
    templeId: 1,
    eventType: 'WORKFLOW_TRANSITION',
    eventCode: 'PROFILE_APPROVED',
    moduleName: 'TEMPLE_PROFILE',
    entityName: null,
    title: 'Approved',
    description: null,
    metadata: null,
    referenceId: null,
    oldStatus: 'SUBMITTED',
    newStatus: 'APPROVED',
    workflowAction: 'APPROVE',
    performerId: 1,
    performerName: null,
    performerRole: 'DC',
    comment: null,
    createdBySystem: false,
    occurredAt,
  })

  it('should_return_empty_array_when_no_events', () => {
    const result = groupTimelineEvents([])
    expect(result).toHaveLength(0)
  })

  it('should_bucket_today_event_into_today_group', () => {
    const now = new Date()
    const todayIso = now.toISOString()

    const result = groupTimelineEvents([makeEvent(todayIso)])

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Today')
    expect(result[0].events).toHaveLength(1)
  })

  it('should_bucket_old_event_into_older_group', () => {
    const old = new Date()
    old.setDate(old.getDate() - 30)

    const result = groupTimelineEvents([makeEvent(old.toISOString())])

    expect(result).toHaveLength(1)
    expect(result[0].label).toBe('Older')
  })

  it('should_not_include_empty_groups', () => {
    // Only provide events from one bucket; the rest should be omitted
    const old = new Date()
    old.setDate(old.getDate() - 30)

    const result = groupTimelineEvents([makeEvent(old.toISOString())])
    const labels = result.map((g) => g.label)

    expect(labels).not.toContain('Today')
    expect(labels).not.toContain('Yesterday')
    expect(labels).not.toContain('This Week')
    expect(labels).toContain('Older')
  })
})
