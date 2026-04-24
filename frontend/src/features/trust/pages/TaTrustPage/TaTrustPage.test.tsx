import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TaTrustPage } from './TaTrustPage'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ templeId: '761' }),
  }
})

vi.mock('@/features/auth/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetCurrentUserQuery: vi.fn().mockReturnValue({
    data: { success: true, data: { id: 1, username: 'ta_user', role: 'TEMPLE_AUTHORITY', templeId: 761, aadhaarVerified: true } },
    isLoading: false,
  }),
}))

const mockCreateTrust = vi.fn()
const mockUpdateTrust = vi.fn()
const mockAddMember = vi.fn()
const mockUpdateMember = vi.fn()
const mockDeleteMember = vi.fn()
const mockSubmitFinancial = vi.fn()
const mockCreateMeeting = vi.fn()
const mockUploadMinutes = vi.fn()

vi.mock('@/features/trust/trustApi', () => ({
  trustApi: {
    reducerPath: 'trustApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetTrustByTempleQuery: vi.fn(),
  useCreateTrustMutation: () => [mockCreateTrust, { isLoading: false }],
  useUpdateTrustMutation: () => [mockUpdateTrust, { isLoading: false }],
  useGetBoardMembersQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useAddBoardMemberMutation: () => [mockAddMember, { isLoading: false }],
  useUpdateBoardMemberMutation: () => [mockUpdateMember, { isLoading: false }],
  useDeleteBoardMemberMutation: () => [mockDeleteMember, { isLoading: false }],
  useListFinancialsQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useSubmitFinancialMutation: () => [mockSubmitFinancial, { isLoading: false }],
  useListBoardMeetingsQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useCreateBoardMeetingMutation: () => [mockCreateMeeting, { isLoading: false }],
  useUploadMeetingMinutesMutation: () => [mockUploadMinutes, { isLoading: false }],
}))

import { useGetTrustByTempleQuery } from '@/features/trust/trustApi'

describe('TaTrustPage', () => {
  beforeEach(() => {
    vi.mocked(useGetTrustByTempleQuery).mockReturnValue({
      data: { success: true, message: 'Success', data: [] },
      isLoading: false,
    } as ReturnType<typeof useGetTrustByTempleQuery>)
  })

  it('renders empty state and allows registering a trust', async () => {
    renderWithProviders(<TaTrustPage />)
    
    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/Trust not registered/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[0])

    // Form should now be visible
    expect(screen.getByLabelText(/Trust Name \*/i)).toBeInTheDocument()
  })

  it('shows validation errors for invalid inputs', async () => {
    renderWithProviders(<TaTrustPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Trust not registered/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[0])

    await user.type(screen.getByLabelText(/Registration Number \*/i), 'TR@123') // Invalid format - @ not allowed
    await user.type(screen.getByLabelText(/PAN Number \*/i), 'INVALID') // Invalid PAN
    
    // Trigger validation by submitting
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[1])

    await waitFor(() => {
      expect(screen.getByText(/Must be alphanumeric/i)).toBeInTheDocument()
      expect(screen.getByText(/Invalid PAN format/i)).toBeInTheDocument()
    })
  })
})
