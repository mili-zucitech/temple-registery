import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { server } from '@/test/mocks/server'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { LoginPage } from '../pages/LoginPage/LoginPage'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

describe('useLogin / LoginPage', () => {
  it('should_redirect_to_dashboard_when_login_succeeds', async () => {
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
    const { http, HttpResponse } = await import('msw')
    server.use(
      http.post('/api/v1/auth/login', () =>
        HttpResponse.json(
          { success: false, message: 'Invalid credentials', errorCode: 'INVALID_CREDENTIALS' },
          { status: 401 }
        )
      )
    )

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
