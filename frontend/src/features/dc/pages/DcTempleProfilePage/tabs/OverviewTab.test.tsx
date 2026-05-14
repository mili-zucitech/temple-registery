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

  // Task 1.2: Unit tests for contact field removal
  describe('Contact Field Removal (Task 1.2)', () => {
    it('should_NOT_renderContactFields_in_TempleIdentitySection', () => {
      // Create a profile with contact data in currentProfile
      const profileWithContact: TempleFullProfileResponse = {
        ...baseProfile,
        currentProfile: {
          id: 1,
          templeId: 150001,
          versionNumber: 1,
          contactPersonName: 'Current Contact Name',
          contactPersonDesignation: 'Current Designation',
          phone: '9876543210',
          email: 'current@example.com',
          website: null,
          photoUrl: null,
          languagesOfWorship: ['Kannada'],
          bankName: null,
          bankIfsc: null,
          bankAccountMasked: null,
          description: null,
          landmark: null,
          historicalSignificance: null,
          annualFestivals: null,
          linkedInstitutions: null,
          approvedAt: '2026-01-01T00:00:00',
          approvedBy: 10,
        },
      }

      renderWithProviders(
        <OverviewTab
          profile={profileWithContact}
          canAct={false}
          pendingStaging={null}
          onVerifyTemple={vi.fn(async () => {})}
          onFlagTemple={vi.fn(async () => {})}
        />
      )

      // Verify Temple Identity section exists
      expect(screen.getByText('Temple Identity & Information')).toBeInTheDocument()

      // The contact fields should NOT appear in the Temple Identity section
      // They should only appear in the Primary Contact card
      // Verify that specific contact field labels don't exist in the Temple Identity section
      
      // These labels should not exist anywhere in the component
      // (contact info is displayed differently in Primary Contact card)
      expect(screen.queryByText('Contact Person Name')).not.toBeInTheDocument()
      expect(screen.queryByText('Contact Mobile')).not.toBeInTheDocument()
      expect(screen.queryByText('Contact Email')).not.toBeInTheDocument()
      expect(screen.queryByText('Contact Designation')).not.toBeInTheDocument()
    })

    it('should_renderExactly7Fields_in_TempleIdentitySection', () => {
      const profileWithAllData: TempleFullProfileResponse = {
        ...baseProfile,
        temple: {
          ...baseProfile.temple,
          primaryDeity: 'Ganesh',
          tradition: 'SMARTA',
          yearEstablished: 1900,
          registrationNumber: 'KA-TEST-1',
          aliasName: 'Test Alias',
          languagesOfWorship: 'Kannada',
          pinCode: '560001',
        },
        currentProfile: {
          id: 1,
          templeId: 150001,
          versionNumber: 1,
          contactPersonName: 'Contact Name',
          contactPersonDesignation: 'Manager',
          phone: '9876543210',
          email: 'test@example.com',
          website: null,
          photoUrl: null,
          languagesOfWorship: ['Kannada', 'Tamil'],
          bankName: null,
          bankIfsc: null,
          bankAccountMasked: null,
          description: null,
          landmark: null,
          historicalSignificance: null,
          annualFestivals: null,
          linkedInstitutions: null,
          approvedAt: '2026-01-01T00:00:00',
          approvedBy: 10,
        },
      }

      const { container } = renderWithProviders(
        <OverviewTab
          profile={profileWithAllData}
          canAct={false}
          pendingStaging={null}
          onVerifyTemple={vi.fn(async () => {})}
          onFlagTemple={vi.fn(async () => {})}
        />
      )

      // Verify the 7 expected field labels are present in Temple Identity section
      expect(screen.getByText('Primary Deity')).toBeInTheDocument()
      expect(screen.getByText('Ganesh')).toBeInTheDocument()

      expect(screen.getByText('Tradition')).toBeInTheDocument()
      expect(screen.getByText('SMARTA')).toBeInTheDocument()

      expect(screen.getByText('Year Established')).toBeInTheDocument()
      expect(screen.getByText('1900')).toBeInTheDocument()

      expect(screen.getByText('Registration No.')).toBeInTheDocument()
      expect(screen.getByText('KA-TEST-1')).toBeInTheDocument()

      expect(screen.getByText('Alias Name')).toBeInTheDocument()
      expect(screen.getByText('Test Alias')).toBeInTheDocument()

      expect(screen.getByText('Languages')).toBeInTheDocument()
      // Languages are rendered from currentProfile.languagesOfWorship array
      // Verify the container has both language names in its text content
      const languagesContainer = container.textContent
      expect(languagesContainer).toContain('Kannada')
      expect(languagesContainer).toContain('Tamil')

      expect(screen.getByText('PIN Code')).toBeInTheDocument()
      expect(screen.getByText('560001')).toBeInTheDocument()
    })

    it('should_renderTempleIdentityFields_withNullValues', () => {
      const profileWithNulls: TempleFullProfileResponse = {
        ...baseProfile,
        temple: {
          ...baseProfile.temple,
          primaryDeity: null,
          tradition: null,
          yearEstablished: null,
          registrationNumber: null,
          aliasName: null,
          languagesOfWorship: null,
          pinCode: null,
        },
        currentProfile: null,
      }

      renderWithProviders(
        <OverviewTab
          profile={profileWithNulls}
          canAct={false}
          pendingStaging={null}
          onVerifyTemple={vi.fn(async () => {})}
          onFlagTemple={vi.fn(async () => {})}
        />
      )

      // Verify the 7 field labels are still present
      expect(screen.getByText('Primary Deity')).toBeInTheDocument()
      expect(screen.getByText('Tradition')).toBeInTheDocument()
      expect(screen.getByText('Year Established')).toBeInTheDocument()
      expect(screen.getByText('Registration No.')).toBeInTheDocument()
      expect(screen.getByText('Alias Name')).toBeInTheDocument()
      expect(screen.getByText('Languages')).toBeInTheDocument()
      expect(screen.getByText('PIN Code')).toBeInTheDocument()

      // Verify that null values render as '—' (handled by DetailItem mock)
      const dashElements = screen.getAllByText('—')
      // Should have at least 7 dashes for the 7 null fields in Temple Identity
      expect(dashElements.length).toBeGreaterThanOrEqual(7)
    })

    it('should_applyCorrectGridLayout_for_TempleIdentitySection', () => {
      const { container } = renderWithProviders(
        <OverviewTab
          profile={baseProfile}
          canAct={false}
          pendingStaging={null}
          onVerifyTemple={vi.fn(async () => {})}
          onFlagTemple={vi.fn(async () => {})}
        />
      )

      // Find the Temple Identity section
      const templeIdentitySection = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.md\\:grid-cols-3')
      
      // Verify the grid layout classes are applied
      expect(templeIdentitySection).toBeInTheDocument()
      
      // The grid should have the responsive classes:
      // - grid-cols-1 (mobile: single column)
      // - sm:grid-cols-2 (tablet: 2 columns)
      // - md:grid-cols-3 (desktop: 3 columns)
      expect(templeIdentitySection?.className).toContain('grid')
      expect(templeIdentitySection?.className).toContain('grid-cols-1')
      expect(templeIdentitySection?.className).toContain('sm:grid-cols-2')
      expect(templeIdentitySection?.className).toContain('md:grid-cols-3')
    })

    it('should_displayContactFields_ONLY_in_PrimaryContactCard', () => {
      const profileWithContact: TempleFullProfileResponse = {
        ...baseProfile,
        currentProfile: {
          id: 1,
          templeId: 150001,
          versionNumber: 1,
          contactPersonName: 'John Doe',
          contactPersonDesignation: 'Temple Manager',
          phone: '9876543210',
          email: 'john@temple.com',
          website: 'https://temple.com',
          photoUrl: null,
          languagesOfWorship: ['Kannada'],
          bankName: null,
          bankIfsc: null,
          bankAccountMasked: null,
          description: null,
          landmark: null,
          historicalSignificance: null,
          annualFestivals: null,
          linkedInstitutions: null,
          approvedAt: '2026-01-01T00:00:00',
          approvedBy: 10,
        },
      }

      renderWithProviders(
        <OverviewTab
          profile={profileWithContact}
          canAct={false}
          pendingStaging={null}
          onVerifyTemple={vi.fn(async () => {})}
          onFlagTemple={vi.fn(async () => {})}
        />
      )

      // Verify Primary Contact card exists
      expect(screen.getByText('Primary Contact')).toBeInTheDocument()

      // Verify contact information is displayed
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Temple Manager')).toBeInTheDocument()
      expect(screen.getByText('9876543210')).toBeInTheDocument()
      expect(screen.getByText('john@temple.com')).toBeInTheDocument()
      expect(screen.getByText('https://temple.com')).toBeInTheDocument()

      // Verify Temple Identity section does NOT contain these contact values
      // (they should only appear once in the Primary Contact card)
      const templeIdentityHeader = screen.getByText('Temple Identity & Information')
      expect(templeIdentityHeader).toBeInTheDocument()
      
      // The contact name should not appear as a label in Temple Identity
      expect(screen.queryByText('Contact Person Name')).not.toBeInTheDocument()
      expect(screen.queryByText('Contact Mobile')).not.toBeInTheDocument()
      expect(screen.queryByText('Contact Email')).not.toBeInTheDocument()
    })
  })
})
