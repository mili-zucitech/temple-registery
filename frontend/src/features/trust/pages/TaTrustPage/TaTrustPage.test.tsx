import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TaTrustPage } from './TaTrustPage'
import { server } from '@/test/mocks/server'
import { http, HttpResponse } from 'msw'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ templeId: '761' }),
  }
})

describe('TaTrustPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/v1/temples/761/trusts', () => {
        return HttpResponse.json({ success: true, message: 'Success', data: [] })
      }),
      http.post('/api/v1/temples/761/trusts', async ({ request }) => {
        const body = await request.json() as any
        return HttpResponse.json({ success: true, message: 'Trust registered successfully', data: { id: 1, ...body } }, { status: 201 })
      })
    )
  })

  it('renders empty state and allows registering a trust', async () => {
    renderWithProviders(<TaTrustPage />)
    
    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText(/Trust not registered/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[0])

    // Fill the form
    await user.type(screen.getByLabelText(/Trust Name \*/i), 'Test Trust')
    await user.type(screen.getByLabelText(/Registration Number \*/i), 'TR123')
    await user.type(screen.getByLabelText(/Date of Registration \*/i), '2023-01-01')
    await user.type(screen.getByLabelText(/Registering Authority \*/i), 'Govt')
    await user.type(screen.getByLabelText(/PAN Number \*/i), 'ABCDE1234F')
    await user.type(screen.getByLabelText(/Bank Account Number \*/i), '123456789012')
    await user.type(screen.getByLabelText(/Bank Name \*/i), 'SBI')
    await user.type(screen.getByLabelText(/Bank Branch \*/i), 'Main Branch')

    // Submit the form
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[1])

    await waitFor(() => {
      expect(screen.getByText('Test Trust')).toBeInTheDocument()
    })
  })

  it('shows validation errors for invalid inputs', async () => {
    renderWithProviders(<TaTrustPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Trust not registered/i)).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[0])

    await user.type(screen.getByLabelText(/Registration Number \*/i), 'TR-123') // Invalid format
    await user.type(screen.getByLabelText(/PAN Number \*/i), 'INVALID') // Invalid PAN
    
    // Trigger validation
    await user.click(screen.getAllByRole('button', { name: /Register Trust/i })[1])

    await waitFor(() => {
      expect(screen.getByText(/Must be alphanumeric/i)).toBeInTheDocument()
      expect(screen.getByText(/Invalid PAN format/i)).toBeInTheDocument()
    })
  })
})
