import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { SystemConfigPage } from './SystemConfigPage'

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockConfigs = [
  {
    id: 1, configKey: 'sla.declaration.review_days', configValue: '7',
    dataType: 'INTEGER', category: 'SLA', description: 'Review window', active: true,
  },
  {
    id: 2, configKey: 'notification.email.enabled', configValue: 'true',
    dataType: 'BOOLEAN', category: 'NOTIFICATION', description: 'Email toggle', active: true,
  },
  {
    id: 3, configKey: 'feature.evidence_pack.enabled', configValue: 'false',
    dataType: 'BOOLEAN', category: 'FEATURE', description: 'Evidence pack', active: true,
  },
]

const mockUpdateConfig = vi.fn().mockResolvedValue({ data: { success: true } })

vi.mock('../../adminApi', () => ({
  adminApi: {
    reducerPath: 'adminApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useListSystemConfigQuery: vi.fn(),
  useUpdateSystemConfigMutation: () => [mockUpdateConfig, { isLoading: false }],
}))

import { useListSystemConfigQuery } from '../../adminApi'

describe('SystemConfigPage', () => {
  beforeEach(() => {
    vi.mocked(useListSystemConfigQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockConfigs },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useListSystemConfigQuery>)
    mockUpdateConfig.mockClear()
  })

  it('should render config categories (SLA, NOTIFICATION, FEATURE)', async () => {
    renderWithProviders(<SystemConfigPage />)
    await waitFor(() => {
      expect(screen.getByText('SLA Thresholds')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Feature Flags')).toBeInTheDocument()
    })
  })

  it('should display human-readable labels from metadata', async () => {
    renderWithProviders(<SystemConfigPage />)
    await waitFor(() => {
      expect(screen.getByText('Declaration Review SLA')).toBeInTheDocument()
      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
      expect(screen.getAllByText(/Evidence Pack/i).length).toBeGreaterThan(0)
    })
  })

  it('should render INTEGER configs as number inputs', async () => {
    renderWithProviders(<SystemConfigPage />)
    await waitFor(() => {
      const input = screen.getByDisplayValue('7')
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })
  })

  it('should render BOOLEAN configs as Switch toggles', async () => {
    renderWithProviders(<SystemConfigPage />)
    await waitFor(() => {
      const switches = screen.getAllByRole('switch')
      expect(switches.length).toBeGreaterThanOrEqual(2)
    })
  })

  it('should update input value when user types', async () => {
    renderWithProviders(<SystemConfigPage />)
    const user = userEvent.setup()
    const input = await screen.findByDisplayValue('7')
    await user.clear(input)
    await user.type(input, '14')
    expect(input).toHaveValue(14)
  })

  it('should show loading skeleton when fetching', () => {
    vi.mocked(useListSystemConfigQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
    } as ReturnType<typeof useListSystemConfigQuery>)
    renderWithProviders(<SystemConfigPage />)
    // Skeleton renders — no crash
    expect(screen.queryByText(/SLA Thresholds/i)).not.toBeInTheDocument()
  })

  it('should show empty state when no configs exist', async () => {
    vi.mocked(useListSystemConfigQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: [] },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useListSystemConfigQuery>)
    renderWithProviders(<SystemConfigPage />)
    await waitFor(() => {
      expect(screen.getByText(/no configuration/i)).toBeInTheDocument()
    })
  })

  it('should filter configs using the search input', async () => {
    renderWithProviders(<SystemConfigPage />)
    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'email')
    await waitFor(() => {
      expect(screen.getByText('Email Notifications')).toBeInTheDocument()
      expect(screen.queryByText('Declaration Review SLA')).not.toBeInTheDocument()
    })
  })
})
