// Feature: asset-declaration-complete, Property: Status Badge Rendering

import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge, DeclarationStatusBadge } from '../StatusBadge'
import {
  DECLARATION_STATUSES,
  DECLARATION_STATUS_LABELS,
  type DeclarationStatus,
} from '@/features/declaration/declarationTypes'

describe('StatusBadge snapshots — all 12 declaration statuses', () => {
  DECLARATION_STATUSES.forEach((status) => {
    it(`renders <StatusBadge status="${status}" /> correctly`, () => {
      const { container } = render(<StatusBadge status={status} />)
      expect(container).toMatchSnapshot()
    })
  })
})

describe('DeclarationStatusBadge snapshots — isOverdue=false', () => {
  DECLARATION_STATUSES.forEach((status) => {
    it(`renders <DeclarationStatusBadge status="${status}" isOverdue={false} /> correctly`, () => {
      const { container } = render(
        <DeclarationStatusBadge status={status} isOverdue={false} />,
      )
      expect(container).toMatchSnapshot()
    })
  })
})

describe('DeclarationStatusBadge snapshots — isOverdue=true', () => {
  DECLARATION_STATUSES.forEach((status) => {
    it(`renders <DeclarationStatusBadge status="${status}" isOverdue={true} /> with overdue badge`, () => {
      const { container } = render(
        <DeclarationStatusBadge status={status} isOverdue={true} />,
      )
      expect(container).toMatchSnapshot()
    })
  })
})

describe('StatusBadge rendered text', () => {
  const EXPECTED_TEXT: Record<DeclarationStatus, string> = {
    DRAFT: 'DRAFT',
    SUBMITTED: 'SUBMITTED',
    UNDER_REVIEW: 'UNDER REVIEW',
    CLARIFICATION_REQUIRED: 'CLARIFICATION REQUIRED',
    CLARIFICATION_RESPONDED: 'CLARIFICATION RESPONDED',
    SITE_VISIT_SCHEDULED: 'SITE VISIT SCHEDULED',
    SITE_VISIT_COMPLETED: 'SITE VISIT COMPLETED',
    VERIFIED: 'VERIFIED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    OVERDUE: 'OVERDUE',
    SUPERSEDED: 'SUPERSEDED',
  }

  DECLARATION_STATUSES.forEach((status) => {
    it(`status "${status}" renders text "${EXPECTED_TEXT[status]}"`, () => {
      const { getByText } = render(<StatusBadge status={status} />)
      expect(getByText(EXPECTED_TEXT[status])).toBeTruthy()
    })
  })
})

describe('DeclarationStatusBadge overdue badge visibility', () => {
  it('shows "OVERDUE" secondary badge when isOverdue=true', () => {
    const { getByText } = render(
      <DeclarationStatusBadge status="APPROVED" isOverdue={true} />,
    )
    expect(getByText('Overdue')).toBeTruthy()
  })

  it('does not show "Overdue" secondary badge when isOverdue=false', () => {
    const { queryByText } = render(
      <DeclarationStatusBadge status="APPROVED" isOverdue={false} />,
    )
    expect(queryByText('Overdue')).toBeNull()
  })

  it('does not show "Overdue" secondary badge when isOverdue is null', () => {
    const { queryByText } = render(
      <DeclarationStatusBadge status="APPROVED" isOverdue={null} />,
    )
    expect(queryByText('Overdue')).toBeNull()
  })
})

describe('DECLARATION_STATUS_LABELS coverage', () => {
  it('has a label entry for every status in DECLARATION_STATUSES', () => {
    DECLARATION_STATUSES.forEach((status) => {
      expect(DECLARATION_STATUS_LABELS[status]).toBeDefined()
      expect(typeof DECLARATION_STATUS_LABELS[status]).toBe('string')
      expect(DECLARATION_STATUS_LABELS[status].length).toBeGreaterThan(0)
    })
  })
})
