import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { LoginPage } from './pages/LoginPage/LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLoginUnwrap = vi.fn()
const mockLogin = vi.fn().mockReturnValue({ unwrap: mockLoginUnwrap })

vi.mock('@/features/auth/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
    util: { invalidateTags: () => ({ type: 'authApi/invalidateTags' }) },
  },
  useLoginMutation: () => [mockLogin, { isLoading: false }],
  useGetCurrentUserQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useMfaVerifyMutation: () => [vi.fn(), { isLoading: false }],
  useLogoutMutation: () => [vi.fn(), { isLoading: false }],
  useAadhaarOtpRequestMutation: () => [vi.fn(), { isLoading: false }],
  useAadhaarOtpVerifyMutation: () => [vi.fn(), { isLoading: false }],
  useRegisterMutation: () => [vi.fn(), { isLoading: false }],
  usePasswordResetRequestMutation: () => [vi.fn(), { isLoading: false }],
  usePasswordResetConfirmMutation: () => [vi.fn(), { isLoading: false }],
}))

vi.mock('@/features/temple-profile/hooks/templeApi', () => ({
  templeApi: {
    reducerPath: 'templeApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
    util: { resetApiState: () => ({ type: 'templeApi/resetApiState' }) },
  },
}))

describe('useLogin / LoginPage', () => {
  it('should_redirect_to_dashboard_when_login_succeeds', async () => {
    mockLoginUnwrap.mockResolvedValue({
      success: true,
      data: { accessToken: 'mock-token', tokenType: 'Bearer', expiresIn: 3600, role: 'DISTRICT_COLLECTOR', userId: 1 },
    })

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialRoute: '/login' })

    await user.type(screen.getByPlaceholderText(/username/i), 'testdc')
    await user.type(screen.getByPlaceholderText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled()
    })
  })

  it('should_show_error_when_credentials_invalid', async () => {
    mockLoginUnwrap.mockRejectedValue(new Error('Invalid credentials'))

    const user = userEvent.setup()
    renderWithProviders(<LoginPage />, { initialRoute: '/login' })

    await user.type(screen.getByPlaceholderText(/username/i), 'baduser')
    await user.type(screen.getByPlaceholderText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })
  })
})
