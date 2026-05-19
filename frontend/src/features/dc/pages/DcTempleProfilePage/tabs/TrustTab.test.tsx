import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { renderWithProviders } from '@/test/utils'
import { TrustTab } from './TrustTab'

vi.mock('../components', () => ({
  SectionCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DetailItem: ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
      <span>{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  ),
}))

vi.mock('@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel', () => ({
  GovernanceActionPanel: ({ canonicalStatus, isVerified }: { canonicalStatus?: string | null; isVerified?: boolean }) => (
    <div data-testid="governance-panel">
      <span>canonical:{canonicalStatus ?? 'null'}</span>
      <span>verified:{String(!!isVerified)}</span>
    </div>
  ),
}))

vi.mock('@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge', () => ({
  ModuleStatusBadge: ({ status }: { status: string }) => <span>badge:{status}</span>,
}))

const emptyBoard = {
  current: [],
  past: [],
  validationIssues: [],
}

describe('TrustTab', () => {
  it('should_showCreateTrustAction_when_trustMissing_and_createCallbackProvided', async () => {
    const onCreateTrust = vi.fn()

    renderWithProviders(
      <TrustTab
        trust={null}
        boardMembers={emptyBoard}
        trustFinancials={[]}
        boardMeetings={[]}
        canAct={false}
        onVerifyTrust={vi.fn(async () => {})}
        onRejectTrust={vi.fn(async () => {})}
        onCreateTrust={onCreateTrust}
      />
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /add trust details/i }))

    expect(onCreateTrust).toHaveBeenCalledTimes(1)
  })

  it('should_useGovernanceStatusAsCanonical_when_legacyWorkflowStatusDiffers', () => {
    renderWithProviders(
      <TrustTab
        trust={{
          id: 11,
          trustName: 'Test Trust',
          trustType: 'MULTI_TRUSTEE',
          registrationNumber: 'TR-11',
          registeringAuthority: 'Sub Registrar',
          dateOfRegistration: '2022-01-10',
          panNumberMasked: 'AB*****4F',
          bankAccountMasked: '******1234',
          bankName: 'SBI',
          bankBranch: 'Main',
          annualIncome: 120000,
          isVerifiedByDc: true,
          dcFlagReason: null,
          reviewStatus: 'APPROVED',
          workflowStatus: 'APPROVED',
          governanceStatus: {
            status: 'RESUBMITTED',
            label: 'Resubmitted — awaiting DC review',
            severity: 'INFO',
            actionableBy: 'DC',
            requiresComment: false,
            allowedActions: ['APPROVE', 'REJECT'],
          },
          validationIssues: [],
          financialStatus: 'SUBMITTED',
        }}
        boardMembers={emptyBoard}
        trustFinancials={[]}
        boardMeetings={[]}
        canAct={false}
        showGovernance={true}
        onVerifyTrust={vi.fn(async () => {})}
        onRejectTrust={vi.fn(async () => {})}
      />
    )

    expect(screen.getByText('canonical:RESUBMITTED')).toBeInTheDocument()
    expect(screen.getByText('verified:false')).toBeInTheDocument()
  })
})
