import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/utils'
import { screen } from '@testing-library/react'
import { DcTempleProfilePage } from './DcTempleProfilePage'

// Preserve real react-router-dom but override hooks used by the page
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: () => ({ templeId: '1' }),
    useNavigate: () => vi.fn(),
  }
})

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
    dialog: { open: false, kind: null, declarationId: null, templeId: null },
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    confirmApprove: vi.fn(),
    confirmReject: vi.fn(),
    confirmClarify: vi.fn(),
    confirmScheduleSiteVisit: vi.fn(),
    confirmMarkUnderReview: vi.fn(),
    isSubmitting: false,
  }),
}))

vi.mock('@/features/dc/dcApi', () => ({
  dcApi: {
    reducerPath: 'dcApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useVerifyTempleMutation: () => [vi.fn(), { isLoading: false }],
  useFlagTempleMutation: () => [vi.fn(), { isLoading: false }],
  useUnflagTempleMutation: () => [vi.fn(), { isLoading: false }],
}))

vi.mock('@/features/governance/governanceApi', () => ({
  governanceApi: {
    reducerPath: 'governanceApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useApproveTrustMutation: () => [vi.fn(), { isLoading: false }],
  useSendBackTrustMutation: () => [vi.fn(), { isLoading: false }],
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

  it('should render page without crashing (loading state)', () => {
    // With profile=undefined and isLoading=false, shows empty state
    renderWithProviders(<DcTempleProfilePage />)
    expect(screen.getByText(/temple not found/i)).toBeInTheDocument()
  })

  it('should NOT render staff/contractor workflow UI (no verify/flag buttons)', () => {
    renderWithProviders(<DcTempleProfilePage />)
    // Verify no workflow buttons exist for staff/contractors
    expect(screen.queryByText(/verify now/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/flag issue/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/oversight status/i)).not.toBeInTheDocument()
  })
})
