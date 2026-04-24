import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TaProfileStatusPage } from './TaProfileStatusPage'
import type { TempleProfileStagingResponse } from '@/features/temple/templeTypes'

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/features/auth/authApi', () => ({
  authApi: {
    reducerPath: 'authApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetCurrentUserQuery: vi.fn(),
}))

vi.mock('@/features/temple-profile/hooks/templeApi', () => ({
  templeApi: {
    reducerPath: 'templeApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetStagingHistoryQuery: vi.fn(),
}))

import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import { useGetStagingHistoryQuery } from '@/features/temple-profile/hooks/templeApi'

const mockUser    = vi.mocked(useGetCurrentUserQuery)
const mockHistory = vi.mocked(useGetStagingHistoryQuery)

const makeRecord = (overrides: Partial<TempleProfileStagingResponse>): TempleProfileStagingResponse => ({
  id: 1,
  templeId: 42,
  versionNumber: 1,
  statusLabel: 'DRAFT',
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  ...overrides,
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaProfileStatusPage', () => {
  beforeEach(() => {
    mockUser.mockReturnValue({
      data: { data: { templeId: 42 } },
      isLoading: false,
    } as ReturnType<typeof useGetCurrentUserQuery>)
  })

  it('should_renderSkeletons_when_historyIsLoading', () => {
    mockUser.mockReturnValue({
      data: { data: { templeId: 42 } },
      isLoading: true,
    } as ReturnType<typeof useGetCurrentUserQuery>)
    mockHistory.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useGetStagingHistoryQuery>)

    renderWithProviders(<TaProfileStatusPage />, { initialRoute: '/ta/profile-status' })

    // Skeleton divs are rendered — no timeline items or heading visible
    expect(screen.queryByText(/Version/i)).not.toBeInTheDocument()
  })

  it('should_renderEmptyState_when_noSubmissionsExist', () => {
    mockHistory.mockReturnValue({
      data: { data: { content: [], totalPages: 0 } },
      isLoading: false,
    } as ReturnType<typeof useGetStagingHistoryQuery>)

    renderWithProviders(<TaProfileStatusPage />, { initialRoute: '/ta/profile-status' })

    expect(screen.getByText(/No submissions yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go to Temple Profile/i })).toBeInTheDocument()
  })

  it('should_renderTimelineItems_when_historyDataIsPresent', async () => {
    const records: TempleProfileStagingResponse[] = [
      makeRecord({
        id: 3,
        versionNumber: 3,
        statusLabel: 'APPROVED',
        contactPersonName: 'Ravi Kumar',
        submittedAt: '2026-03-10T08:00:00Z',
        reviewedAt: '2026-03-12T10:30:00Z',
      }),
      makeRecord({
        id: 2,
        versionNumber: 2,
        statusLabel: 'REJECTED',
        reviewComment: 'Missing historical significance details.',
        submittedAt: '2026-02-01T09:00:00Z',
        reviewedAt: '2026-02-05T15:00:00Z',
      }),
      makeRecord({
        id: 1,
        versionNumber: 1,
        statusLabel: 'SUPERSEDED',
        submittedAt: '2026-01-15T10:00:00Z',
      }),
    ]

    mockHistory.mockReturnValue({
      data: { data: { content: records, totalPages: 1 } },
      isLoading: false,
    } as ReturnType<typeof useGetStagingHistoryQuery>)

    renderWithProviders(<TaProfileStatusPage />, { initialRoute: '/ta/profile-status' })

    await waitFor(() => {
      expect(screen.getByText(/Version 3/i)).toBeInTheDocument()
      expect(screen.getByText(/Version 2/i)).toBeInTheDocument()
      expect(screen.getByText(/Version 1/i)).toBeInTheDocument()
    })

    // Approved record shows "Current" label
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('should_showRejectionComment_when_statusIsRejected', async () => {
    const records: TempleProfileStagingResponse[] = [
      makeRecord({
        id: 1,
        versionNumber: 1,
        statusLabel: 'REJECTED',
        reviewComment: 'Please add more details about the deity.',
        submittedAt: '2026-02-01T09:00:00Z',
        reviewedAt: '2026-02-05T15:00:00Z',
      }),
    ]

    mockHistory.mockReturnValue({
      data: { data: { content: records, totalPages: 1 } },
      isLoading: false,
    } as ReturnType<typeof useGetStagingHistoryQuery>)

    renderWithProviders(<TaProfileStatusPage />, { initialRoute: '/ta/profile-status' })

    await waitFor(() => {
      expect(screen.getByText(/Please add more details about the deity/i)).toBeInTheDocument()
    })
  })
})
