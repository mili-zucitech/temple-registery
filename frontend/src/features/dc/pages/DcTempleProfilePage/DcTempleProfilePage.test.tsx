import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/utils'
import { screen } from '@testing-library/react'
import { DcTempleProfilePage } from './DcTempleProfilePage'

// Minimal mock for react-router-dom hooks
vi.mock('react-router-dom', () => ({
  useParams: () => ({ templeId: '1' }),
  useNavigate: () => vi.fn(),
}))

// Mock hooks used in the page
vi.mock('@/features/dc/dcHooks', () => ({
  useDcTempleProfile: () => ({ profile: undefined, isLoading: false, isError: false }),
  useDcPendingProfileStaging: () => ({ pendingStaging: undefined }),
  useProfileWorkflowActions: () => ({
    submitApproveProfile: vi.fn(),
    submitRejectProfile: vi.fn(),
  }),
  useDcDeclarationDetail: () => ({ declaration: undefined }),
  useWorkflowActions: () => ({
    dialog: {},
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    confirmApprove: vi.fn(),
    confirmReject: vi.fn(),
    confirmClarify: vi.fn(),
    confirmFlagPhysical: vi.fn(),
    confirmMarkUnderReview: vi.fn(),
    isSubmitting: false,
  }),
}))

vi.mock('@/features/dc/dcApi', () => ({
  useVerifyTempleMutation: () => [vi.fn()],
  useFlagTempleMutation: () => [vi.fn()],
  useVerifyTrustMutation: () => [vi.fn()],
  useFlagTrustMutation: () => [vi.fn()],
  useVerifyContractorMutation: () => [vi.fn()],
  useVerifyEmployeeMutation: () => [vi.fn()],
}))

vi.mock('@/app/store', () => ({
  useAppSelector: () => 'SUPER_ADMIN',
}))

// Minimal mocks for child tabs/components
vi.mock('./tabs', () => ({
  OverviewTab: () => <div>OverviewTab</div>,
  DeclarationsTab: () => <div>DeclarationsTab</div>,
  TrustTab: () => <div>TrustTab</div>,
  StaffTab: () => <div>StaffTab</div>,
  ContractorsTab: () => <div>ContractorsTab</div>,
  DocumentsTab: () => <div>DocumentsTab</div>,
}))

// --- TESTS ---
describe('DcTempleProfilePage', () => {
  it('should render empty state when profile is undefined', () => {
    renderWithProviders(<DcTempleProfilePage />)
    expect(screen.getByText(/temple not found/i)).toBeInTheDocument()
  })

  it('should render loading state', () => {
    vi.doMock('@/features/dc/dcHooks', async () => ({
      ...(await vi.importActual('@/features/dc/dcHooks')),
      useDcTempleProfile: () => ({ profile: undefined, isLoading: true, isError: false }),
    }))
    renderWithProviders(<DcTempleProfilePage />)
    expect(screen.getAllByText(/skeleton/i).length).toBeGreaterThan(0)
  })

  it('should render tabs when profile is present', () => {
    vi.doMock('@/features/dc/dcHooks', async () => ({
      ...(await vi.importActual('@/features/dc/dcHooks')),
      useDcTempleProfile: () => ({
        profile: {
          temple: { name: 'Test Temple', verificationStatus: 'VERIFIED', grade: 'A', registrationNumber: 'REG123' },
          declarations: [],
          boardMembers: { current: [], past: [] },
          employees: [],
          contractors: [],
          trust: {},
          trustFinancials: {},
          districtName: 'District',
          talukName: 'Taluk',
          hobliName: 'Hobli',
        },
        isLoading: false,
        isError: false,
      }),
    }))
    renderWithProviders(<DcTempleProfilePage />)
    expect(screen.getByText(/overview/i)).toBeInTheDocument()
    expect(screen.getByText(/trust & board/i)).toBeInTheDocument()
    expect(screen.getByText(/staff/i)).toBeInTheDocument()
    expect(screen.getByText(/contractors/i)).toBeInTheDocument()
    expect(screen.getByText(/documents/i)).toBeInTheDocument()
  })
})
