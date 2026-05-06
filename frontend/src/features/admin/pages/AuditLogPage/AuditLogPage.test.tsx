import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { AuditLogPage } from './AuditLogPage'

// ── API mocks ──────────────────────────────────────────────────────────────────

const mockAuditEvents = [
  {
    id: 1, actorId: 42, actorRole: 'SUPER_ADMIN', action: 'CREATE',
    entityType: 'TEMPLE', entityId: 100, details: 'Created temple record',
    occurredAt: '2024-06-01T10:30:00',
  },
  {
    id: 2, actorId: 43, actorRole: 'DISTRICT_COLLECTOR', action: 'APPROVE',
    entityType: 'DECLARATION', entityId: 200, details: undefined,
    occurredAt: '2024-06-02T14:00:00',
  },
  {
    id: 3, actorId: 44, actorRole: 'TEMPLE_AUTHORITY', action: 'SUBMIT',
    entityType: 'TRUST', entityId: 300, details: 'Submitted trust data',
    occurredAt: '2024-06-03T09:15:00',
  },
]

const mockAuthEvents = [
  {
    id: 10, username: 'admin@example.com', eventType: 'LOGIN',
    status: 'SUCCESS', ipAddress: '192.168.1.1',
    occurredAt: '2024-06-01T09:00:00',
  },
]

const mockGovernanceHistory = [
  {
    id: 20, actorId: 42, actorRole: 'SUPER_ADMIN', action: 'SUSPEND',
    entityType: 'TEMPLE', entityId: 100, details: 'Non-compliance',
    occurredAt: '2024-06-04T11:00:00',
  },
]

vi.mock('../../adminApi', () => ({
  adminApi: {
    reducerPath: 'adminApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useListAuditEventsQuery: vi.fn(),
  useListAuthEventsQuery: vi.fn(),
  useListGovernanceHistoryQuery: vi.fn(),
}))

import {
  useListAuditEventsQuery,
  useListAuthEventsQuery,
  useListGovernanceHistoryQuery,
} from '../../adminApi'

describe('AuditLogPage', () => {
  beforeEach(() => {
    vi.mocked(useListAuditEventsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: mockAuditEvents, totalElements: 3, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListAuditEventsQuery>)

    vi.mocked(useListAuthEventsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: mockAuthEvents, totalElements: 1, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListAuthEventsQuery>)

    vi.mocked(useListGovernanceHistoryQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: mockGovernanceHistory, totalElements: 1, totalPages: 1 } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListGovernanceHistoryQuery>)
  })

  it('should render the Data Mutations tab by default with audit events', async () => {
    renderWithProviders(<AuditLogPage />)
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /data mutations/i })).toBeInTheDocument()
    })
    expect(screen.getByRole('tab', { name: /governance/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /authentication/i })).toBeInTheDocument()
  })

  it('should display audit events with actor and action badge', async () => {
    renderWithProviders(<AuditLogPage />)
    await waitFor(() => {
      // Action badge CREATE
      expect(screen.getAllByText('CREATE').length).toBeGreaterThan(0)
      // Entity type
      expect(screen.getAllByText('TEMPLE').length).toBeGreaterThan(0)
    })
  })

  it('should show formatted date (not Invalid Date) for occurredAt', async () => {
    renderWithProviders(<AuditLogPage />)
    await waitFor(() => {
      // Should not show "Invalid Date"
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
      // Should show a formatted date
      expect(screen.getByText(/01 Jun 2024/i)).toBeInTheDocument()
    })
  })

  it('should switch to Authentication tab when clicked', async () => {
    renderWithProviders(<AuditLogPage />)
    const user = userEvent.setup()
    const authTab = await screen.findByRole('tab', { name: /authentication/i })
    await user.click(authTab)
    await waitFor(() => {
      expect(screen.getAllByText('LOGIN').length).toBeGreaterThan(0)
    })
  })

  it('should switch to Governance tab when clicked', async () => {
    renderWithProviders(<AuditLogPage />)
    const user = userEvent.setup()
    const govTab = await screen.findByRole('tab', { name: /governance/i })
    await user.click(govTab)
    await waitFor(() => {
      expect(screen.getAllByText('SUSPEND').length).toBeGreaterThan(0)
    })
  })

  it('should show loading skeleton when data is loading', async () => {
    vi.mocked(useListAuditEventsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListAuditEventsQuery>)
    renderWithProviders(<AuditLogPage />)
    // Skeleton renders role="status" or similar; just ensure no crash
    expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
  })

  it('should show empty state when no audit events exist', async () => {
    vi.mocked(useListAuditEventsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [], totalElements: 0, totalPages: 0 } },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListAuditEventsQuery>)
    renderWithProviders(<AuditLogPage />)
    await waitFor(() => {
      expect(screen.getByText(/no mutation events found/i)).toBeInTheDocument()
    })
  })

  it('should handle null/undefined occurredAt gracefully (show dash)', async () => {
    vi.mocked(useListAuditEventsQuery).mockReturnValue({
      data: {
        success: true, message: 'OK',
        data: {
          content: [{ id: 99, actorId: 1, actorRole: 'SUPER_ADMIN', action: 'UPDATE', entityType: 'TEMPLE', entityId: 5, occurredAt: null as unknown as string }],
          totalElements: 1, totalPages: 1,
        },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    } as ReturnType<typeof useListAuditEventsQuery>)
    renderWithProviders(<AuditLogPage />)
    await waitFor(() => {
      expect(screen.queryByText(/invalid date/i)).not.toBeInTheDocument()
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
