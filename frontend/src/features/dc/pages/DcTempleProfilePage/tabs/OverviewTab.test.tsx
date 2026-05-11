import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '@/test/utils'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { OverviewTab } from './OverviewTab'
import type { TempleFullProfileResponse, ProfileStagingResponse } from '@/features/dc/dcTypes'

vi.mock('@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel', () => ({
  GovernanceActionPanel: ({ entityName, canAct }: { entityName: string; canAct: boolean }) => (
    <div data-testid="governance-panel">
      <span>{entityName}</span>
      <span>{canAct ? 'actionable' : 'read-only'}</span>
    </div>
  ),
}))

vi.mock('../components', () => ({
  SectionCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DetailItem: ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
      <span>{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  ),
  KpiCard: ({ label, value }: { label: string; value: string | number }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}))

vi.mock('@/features/dc/components/DcTempleImageGallery', () => ({
  DcTempleImageGallery: () => <div>Gallery</div>,
}))

const baseProfile: TempleFullProfileResponse = {
  temple: {
    id: 150001,
    registrationNumber: 'KA-TEST-1',
    name: 'Test Temple',
    aliasName: null,
    grade: 'A',
    primaryDeity: 'Ganesh',
    tradition: 'SMARTA',
    yearEstablished: 1900,
    history: 'History',
    doorNumber: '10',
    street: 'Main Road',
    villageTown: 'Town',
    pinCode: '560001',
    hobliId: 1,
    talukId: 2,
    districtId: 3,
    districtName: 'District',
    latitude: null,
    longitude: null,
    contactName: 'Temple Contact',
    contactDesignation: 'Manager',
    contactMobile: '9999999999',
    contactEmail: 'temple@example.com',
    photoUrl: null,
    website: null,
    languagesOfWorship: 'Kannada',
    linkedInstitutions: null,
    annualFestivals: null,
    landmark: null,
    historicalSignificance: null,
    bankName: 'Temple Bank',
    bankIfsc: 'SBIN0000001',
    trustRegistered: false,
    assetDeclarationStatus: null,
    status: 'ACTIVE',
    verificationStatus: 'UNVERIFIED',
    dcFlagReason: null,
  },
  hobliName: 'Hobli',
  talukName: 'Taluk',
  districtName: 'District',
  cityName: 'City',
  trust: null,
  boardMembers: {
    current: [],
    past: [],
    validationIssues: [],
  },
  trustFinancials: [],
  boardMeetings: [],
  employees: [],
  contractors: [],
  declarations: [],
  currentProfile: null,
}

const basePending: ProfileStagingResponse = {
  id: 150004,
  templeId: 150001,
  version: 2,
  status: 'REJECTED',
  governanceStatus: {
    status: 'REJECTED',
    actionableBy: 'TA',
    allowedActions: [],
  },
  contactPersonName: 'Pending Contact',
  contactPersonDesignation: null,
  phone: null,
  email: null,
  website: null,
  photoUrl: null,
  bankName: null,
  bankAccountNumberMasked: null,
  bankIfsc: null,
  languagesOfWorship: null,
  linkedInstitutions: null,
  description: null,
  annualFestivals: null,
  landmark: null,
  historicalSignificance: null,
  submittedAt: '2026-05-08T05:52:14.342470',
  submittedBy: 1,
  reviewedAt: '2026-05-08T05:54:28.560686',
  reviewedBy: 10,
  reviewComment: 'Rejected',
}

describe('OverviewTab', () => {
  it('should_showTempleOversight_when_pendingStagingIsNonActionable', () => {
    renderWithProviders(
      <OverviewTab
        profile={baseProfile}
        canAct={true}
        pendingStaging={basePending}
        onApproveProfile={vi.fn(async () => {})}
        onRejectProfile={vi.fn(async () => {})}
        onVerifyTemple={vi.fn(async () => {})}
        onFlagTemple={vi.fn(async () => {})}
      />
    )

    expect(screen.getByText('Temple Oversight')).toBeInTheDocument()
    expect(screen.queryByText('Temple Profile Update')).not.toBeInTheDocument()
  })

  it('should_showPendingContactData_when_pendingStagingIsUNDER_REVIEW', () => {
    // Data visibility is gated on workflow status IN (SUBMITTED/UNDER_REVIEW/RESUBMITTED),
    // not on allowedActions. So UNDER_REVIEW with no action buttons must still show pending data.
    const underReviewPending: ProfileStagingResponse = {
      ...basePending,
      status: 'UNDER_REVIEW',
      governanceStatus: {
        status: 'UNDER_REVIEW',
        actionableBy: 'DC',
        allowedActions: [],           // no action buttons yet
      },
      contactPersonName: 'Under Review Contact',
      phone: '8888888888',
    }

    renderWithProviders(
      <OverviewTab
        profile={baseProfile}
        canAct={true}
        pendingStaging={underReviewPending}
        onApproveProfile={vi.fn(async () => {})}
        onRejectProfile={vi.fn(async () => {})}
        onVerifyTemple={vi.fn(async () => {})}
        onFlagTemple={vi.fn(async () => {})}
      />
    )

    // 2-layer priority: displayPendingStaging is set (UNDER_REVIEW is in the visibility set),
    // so effectiveContactName must resolve to the pending value, not the temple fallback.
    expect(screen.getAllByText('Under Review Contact').length).toBeGreaterThan(0)
  })

  it('should_showDash_when_noCurrentProfileAndNoPendingStaging_for_contactFields', () => {
    // 2-layer priority: effectiveContactName = displayPendingStaging?.contactPersonName
    //                                         || currentProfile?.contactPersonName
    //                                         || null  (NO temple.contactName fallback)
    // When both layers are null, the field renders '—', not the stale temple.contactName.
    renderWithProviders(
      <OverviewTab
        profile={{ ...baseProfile, currentProfile: null }}
        canAct={false}
        pendingStaging={null}
        onVerifyTemple={vi.fn(async () => {})}
        onFlagTemple={vi.fn(async () => {})}
      />
    )

    // baseProfile.temple.contactName = 'Temple Contact' — must NOT appear via fallback.
    // DetailItem mock renders '—' when value is null.
    const contactNameItems = screen.getAllByText('—')
    expect(contactNameItems.length).toBeGreaterThan(0)
    expect(screen.queryByText('Temple Contact')).not.toBeInTheDocument()
  })

  it('should_hideBankSection_when_noBankDataOnEitherLayer', () => {
    // The Bank Account card is conditionally rendered only when at least one of
    // effectiveBankName, effectiveBankIfsc, or effectiveBankAccountMasked is truthy.
    // When both layers lack bank data, the section must not appear (no crash, no 'undefined').
    renderWithProviders(
      <OverviewTab
        profile={{ ...baseProfile, currentProfile: null }}
        canAct={false}
        pendingStaging={null}
        onVerifyTemple={vi.fn(async () => {})}
        onFlagTemple={vi.fn(async () => {})}
      />
    )

    expect(screen.queryByText('Bank Account')).not.toBeInTheDocument()
  })

  it('should_showPendingBankData_when_pendingStagingIsSubmitted', () => {
    const submittedWithBank: ProfileStagingResponse = {
      ...basePending,
      status: 'SUBMITTED',
      governanceStatus: {
        status: 'SUBMITTED',
        actionableBy: 'DC',
        allowedActions: ['APPROVE', 'REJECT'],
      },
      bankName: 'Pending Bank',
      bankIfsc: 'HDFC0009999',
      bankAccountNumberMasked: 'XXXX1234',
    }

    renderWithProviders(
      <OverviewTab
        profile={{ ...baseProfile, currentProfile: null }}
        canAct={true}
        pendingStaging={submittedWithBank}
        onApproveProfile={vi.fn(async () => {})}
        onRejectProfile={vi.fn(async () => {})}
        onVerifyTemple={vi.fn(async () => {})}
        onFlagTemple={vi.fn(async () => {})}
      />
    )

    expect(screen.getByText('Bank Account')).toBeInTheDocument()
    expect(screen.getByText('Pending Bank')).toBeInTheDocument()
    expect(screen.getByText('HDFC0009999')).toBeInTheDocument()
  })
})
