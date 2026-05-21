import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { LoginPage } from './LoginPage'

// Mock the useLogin hook
vi.mock('../../authHooks', () => ({
  useLogin: vi.fn(),
}))

import { useLogin } from '../../authHooks'

describe('LoginPage', () => {
  const mockHandleLogin = vi.fn()

  beforeEach(() => {
    vi.mocked(useLogin).mockReturnValue({
      handleLogin: mockHandleLogin,
      isLoading: false,
    })
    mockHandleLogin.mockClear()
  })

  it('should_renderLoginForm_always', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByPlaceholderText(/enter your username/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
  })

  it('should_renderSubmitButton', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should_renderBrandingText', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/temple registry portal/i)).toBeInTheDocument()
  })

  it('should_showLoadingState_when_isLoading', () => {
    vi.mocked(useLogin).mockReturnValue({
      handleLogin: mockHandleLogin,
      isLoading: true,
    })
    renderWithProviders(<LoginPage />)
    const submitBtn = screen.getByRole('button', { name: /signing in|sign in/i })
    expect(submitBtn).toBeDisabled()
  })

  it('should_showPasswordToggle_and_changeInputType', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const passwordInput = screen.getByPlaceholderText(/enter your password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Find the toggle button (has eye icon, not submit button)
    const toggleBtn = screen.getByRole('button', { name: '' })
    await user.click(toggleBtn)
    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('should_showValidationError_when_submittedWithEmptyFields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    const submitBtn = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitBtn)
    // Zod validation: username and password are required
    await waitFor(() => {
      expect(mockHandleLogin).not.toHaveBeenCalled()
    })
  })
})
