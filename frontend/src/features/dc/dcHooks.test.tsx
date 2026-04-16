/**
 * Unit tests for DC hooks — local state logic and callback wiring.
 *
 * Network calls from RTK Query are mocked at the module level to avoid
 * MSW/Node AbortSignal compatibility issues and keep tests focused on
 * hook logic (dialog state, URL sync, callback wiring).
 */
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from '@/app/rootReducer'
import type {
  WorkflowApproveRequest,
  WorkflowRejectRequest,
  DcClarifyRequest,
} from '@/features/dc/dcTypes'

// ─── Top-level mutation mocks (must be defined before vi.mock) ────────────────

const mockRefetch = vi.fn()
const mockApprove = vi.fn()
const mockReject = vi.fn()
const mockClarify = vi.fn()
const mockFlagPhysical = vi.fn()
const mockMarkRead = vi.fn()
const mockMarkAllRead = vi.fn()

// ─── Mock dcApi module ────────────────────────────────────────────────────────
// Avoids MSW/Node.js AbortSignal incompatibility that occurs when RTK Query's
// fetchBaseQuery passes an AbortSignal constructed in jsdom to undici.

vi.mock('@/features/dc/dcApi', () => ({
  dcApi: {
    reducerPath: 'dcApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetDcDashboardQuery: vi.fn(),
  useSearchDcTemplesQuery: vi.fn(),
  useGetDcNotificationsQuery: vi.fn(),
  useGetDcUnreadCountQuery: vi.fn(),
  useMarkNotificationReadMutation: vi.fn(),
  useMarkAllNotificationsReadMutation: vi.fn(),
  useApproveDeclarationMutation: vi.fn(),
  useRejectDeclarationMutation: vi.fn(),
  useClarifyDeclarationMutation: vi.fn(),
  useFlagPhysicalVerificationMutation: vi.fn(),
  useApproveProfileMutation: vi.fn(),
  useRejectProfileMutation: vi.fn(),
  useGetDcTempleProfileQuery: vi.fn(),
  useGetDcPendingProfileStagingQuery: vi.fn(),
  useGetDcDeclarationDetailQuery: vi.fn(),
}))

// Import hooks AFTER vi.mock is hoisted
import {
  useDcDashboard,
  useDcNotifications,
  useWorkflowActions,
  useDcTempleSearch,
} from '@/features/dc/dcHooks'
import {
  useGetDcDashboardQuery,
  useGetDcNotificationsQuery,
  useGetDcUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  useSearchDcTemplesQuery,
} from '@/features/dc/dcApi'

// ─── Test wrappers ────────────────────────────────────────────────────────────

function buildStore() {
  return configureStore({ reducer: rootReducer })
}

function Wrapper({ children }: { children: ReactNode }) {
  const store = buildStore()
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

function createQueryResult<T>(overrides: Partial<T>): T {
  return overrides as T
}

function createMutationTuple<T>(trigger: ReturnType<typeof vi.fn>, state: Record<string, unknown>): T {
  return [trigger, state] as unknown as T
}

// ─── useDcDashboard ───────────────────────────────────────────────────────────

describe('useDcDashboard', () => {
  const mockDashboard = {
    totalTemples: 50,
    pendingDeclarations: 5,
    overdueDeclarations: 2,
    pendingProfileReviews: 3,
    templesWithoutApprovedDeclaration: 8,
    gradeDistribution: [
      { grade: 'A', count: 20 },
      { grade: 'B', count: 15 },
      { grade: 'C', count: 15 },
    ],
  }

  beforeEach(() => {
    vi.mocked(useGetDcDashboardQuery).mockReset()
  })

  it('should_returnDashboardData_when_querySucceeds', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useGetDcDashboardQuery>>({
        data: { success: true, message: 'OK', data: mockDashboard },
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      }),
    )

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.dashboard).toEqual(mockDashboard)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.refetch).toBe(mockRefetch)
  })

  it('should_returnNullDashboard_when_isLoading', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useGetDcDashboardQuery>>({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
      }),
    )

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.dashboard).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('should_setIsError_when_queryFails', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useGetDcDashboardQuery>>({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: mockRefetch,
      }),
    )

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.isError).toBe(true)
    expect(result.current.dashboard).toBeNull()
  })
})

// ─── useDcNotifications ───────────────────────────────────────────────────────

describe('useDcNotifications', () => {
  const mockNotifications = [
    {
      id: 1,
      title: 'Approved',
      body: 'Approved',
      referenceType: 'ASSET_DECLARATION',
      referenceId: 42,
      read: false,
      readAt: null,
      createdAt: '2026-04-09T10:00:00',
    },
    {
      id: 2,
      title: 'Clarify',
      body: 'Clarify',
      referenceType: 'ASSET_DECLARATION',
      referenceId: 43,
      read: true,
      readAt: '2026-04-09T11:00:00',
      createdAt: '2026-04-09T09:00:00',
    },
  ]

  beforeEach(() => {
    mockMarkRead.mockReset()
    mockMarkAllRead.mockReset()

    vi.mocked(useGetDcNotificationsQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useGetDcNotificationsQuery>>({
        data: {
          success: true,
          message: 'OK',
          data: {
            content: mockNotifications,
            page: 0,
            size: 10,
            totalElements: 2,
            totalPages: 1,
            last: true,
          },
        },
        isLoading: false,
        isError: false,
      }),
    )

    vi.mocked(useGetDcUnreadCountQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useGetDcUnreadCountQuery>>({
        data: { success: true, message: 'OK', data: 1 },
        isLoading: false,
        isError: false,
      }),
    )

    mockMarkRead.mockReturnValue({ unwrap: vi.fn().mockResolvedValue(undefined) })
    mockMarkAllRead.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ data: 2 }) })

    vi.mocked(useMarkNotificationReadMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useMarkNotificationReadMutation>>(mockMarkRead, { isLoading: false }),
    )
    vi.mocked(useMarkAllNotificationsReadMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useMarkAllNotificationsReadMutation>>(mockMarkAllRead, { isLoading: false }),
    )
  })

  it('should_returnNotificationsAndUnreadCount_when_queriesSucceed', () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.total).toBe(2)
    expect(result.current.unreadCount).toBe(1)
    expect(result.current.isError).toBe(false)
  })

  it('should_callMarkReadMutation_when_onMarkReadIsInvoked', async () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    await act(async () => {
      await result.current.onMarkRead(1)
    })

    expect(mockMarkRead).toHaveBeenCalledWith(1)
  })

  it('should_callMarkAllReadMutation_when_onMarkAllReadIsInvoked', async () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    await act(async () => {
      await result.current.onMarkAllRead()
    })

    expect(mockMarkAllRead).toHaveBeenCalled()
  })
})

// ─── useDcTempleSearch ────────────────────────────────────────────────────────

describe('useDcTempleSearch', () => {
  const emptyPage = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }

  beforeEach(() => {
    vi.mocked(useSearchDcTemplesQuery).mockReturnValue(
      createQueryResult<ReturnType<typeof useSearchDcTemplesQuery>>({
        data: { success: true, message: 'OK', data: emptyPage },
        isLoading: false,
        isError: false,
        isFetching: false,
      }),
    )
  })

  it('should_readPageFromUrl_when_searchParamIsPresent', () => {
    const WrapperWithPage = ({ children }: { children: ReactNode }) => {
      const store = buildStore()
      return (
        <Provider store={store}>
          <MemoryRouter initialEntries={['/?page=3']}>{children}</MemoryRouter>
        </Provider>
      )
    }

    renderHook(() => useDcTempleSearch(), { wrapper: WrapperWithPage })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3 }),
    )
  })

  it('should_passKeywordToQuery_when_applyFiltersIsCalled', () => {
    const { result } = renderHook(() => useDcTempleSearch(), { wrapper: Wrapper })

    act(() => {
      result.current.applyFilters({ keyword: 'shiva' })
    })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'shiva' }),
    )
  })

  it('should_resetPageToZero_when_applyFiltersIsCalled', () => {
    const WrapperOnPage5 = ({ children }: { children: ReactNode }) => {
      const store = buildStore()
      return (
        <Provider store={store}>
          <MemoryRouter initialEntries={['/?page=5']}>{children}</MemoryRouter>
        </Provider>
      )
    }

    const { result } = renderHook(() => useDcTempleSearch(), { wrapper: WrapperOnPage5 })

    act(() => {
      result.current.applyFilters({ keyword: 'rama' })
    })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0 }),
    )
  })

  it('should_setPageParam_when_goToPageIsCalled', () => {
    const { result } = renderHook(() => useDcTempleSearch(), { wrapper: Wrapper })

    act(() => {
      result.current.goToPage(4)
    })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ page: 4 }),
    )
  })
})

// ─── useWorkflowActions ───────────────────────────────────────────────────────

describe('useWorkflowActions', () => {
  const mockApproveUnwrap = vi.fn()
  const mockRejectUnwrap = vi.fn()
  const mockClarifyUnwrap = vi.fn()
  const mockFlagPhysicalUnwrap = vi.fn()

  beforeEach(() => {
    mockApprove.mockReset()
    mockReject.mockReset()
    mockClarify.mockReset()
    mockFlagPhysical.mockReset()

    mockApprove.mockReturnValue({
      unwrap: mockApproveUnwrap.mockResolvedValue({
        data: { acknowledgementNumber: 'ACK-001' },
        message: 'Approved.',
      }),
    })
    mockReject.mockReturnValue({
      unwrap: mockRejectUnwrap.mockResolvedValue({ message: 'Rejected.' }),
    })
    mockClarify.mockReturnValue({
      unwrap: mockClarifyUnwrap.mockResolvedValue({ message: 'Clarification requested.' }),
    })
    mockFlagPhysical.mockReturnValue({
      unwrap: mockFlagPhysicalUnwrap.mockResolvedValue({ message: 'Flagged.' }),
    })

    vi.mocked(useApproveDeclarationMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useApproveDeclarationMutation>>(mockApprove, { isLoading: false }),
    )
    vi.mocked(useRejectDeclarationMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useRejectDeclarationMutation>>(mockReject, { isLoading: false }),
    )
    vi.mocked(useClarifyDeclarationMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useClarifyDeclarationMutation>>(mockClarify, { isLoading: false }),
    )
    vi.mocked(useFlagPhysicalVerificationMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useFlagPhysicalVerificationMutation>>(mockFlagPhysical, { isLoading: false }),
    )
  })

  it('should_openDialog_with_correctKindAndId_when_openDialogIsCalled', () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    expect(result.current.dialog.open).toBe(false)
    expect(result.current.dialog.kind).toBeNull()

    act(() => {
      result.current.openDialog('approve', 42)
    })

    expect(result.current.dialog.open).toBe(true)
    expect(result.current.dialog.kind).toBe('approve')
    expect(result.current.dialog.declarationId).toBe(42)
  })

  it('should_closeDialog_and_resetState_when_closeDialogIsCalled', () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => {
      result.current.openDialog('reject', 10)
    })
    act(() => {
      result.current.closeDialog()
    })

    expect(result.current.dialog.open).toBe(false)
    expect(result.current.dialog.kind).toBeNull()
    expect(result.current.dialog.declarationId).toBeNull()
  })

  it('should_notCallMutation_when_declarationIdIsNull_onConfirmApprove', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    await act(async () => {
      await result.current.confirmApprove({ notes: '' })
    })

    expect(mockApprove).not.toHaveBeenCalled()
  })

  it('should_callApproveMutation_with_correctArgs_when_confirmApproveIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => {
      result.current.openDialog('approve', 42)
    })

    await act(async () => {
      await result.current.confirmApprove({ notes: 'LGTM' } satisfies WorkflowApproveRequest)
    })

    expect(mockApprove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, body: { notes: 'LGTM' } }),
    )
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_callRejectMutation_with_correctArgs_when_confirmRejectIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => {
      result.current.openDialog('reject', 99)
    })

    await act(async () => {
      await result.current.confirmReject({ reason: 'Missing docs' } satisfies WorkflowRejectRequest)
    })

    expect(mockReject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, body: { reason: 'Missing docs' } }),
    )
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_callClarifyMutation_with_correctArgs_when_confirmClarifyIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => {
      result.current.openDialog('clarify', 12)
    })

    await act(async () => {
      await result.current.confirmClarify({ notes: 'Need supporting records' } satisfies DcClarifyRequest)
    })

    expect(mockClarify).toHaveBeenCalledWith(
      expect.objectContaining({ id: 12, body: { notes: 'Need supporting records' } }),
    )
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_callFlagPhysicalMutation_with_correctArgs_when_confirmFlagPhysicalIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => {
      result.current.openDialog('flag-physical', 55)
    })

    await act(async () => {
      await result.current.confirmFlagPhysical({ notes: 'Site visit required' } satisfies DcClarifyRequest)
    })

    expect(mockFlagPhysical).toHaveBeenCalledWith(
      expect.objectContaining({ id: 55, body: { notes: 'Site visit required' } }),
    )
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_returnIsSubmittingTrue_when_anyMutationIsLoading', () => {
    vi.mocked(useApproveDeclarationMutation).mockReturnValue(
      createMutationTuple<ReturnType<typeof useApproveDeclarationMutation>>(mockApprove, { isLoading: true }),
    )

    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    expect(result.current.isSubmitting).toBe(true)
  })
})