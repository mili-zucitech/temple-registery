/**
 * Unit tests for DC hooks — local state logic and callback wiring.
 *
 * Network calls from RTK Query are mocked at the module level to avoid
 * MSW/Node AbortSignal compatibility issues and keep tests focused on
 * hook logic (dialog state, URL sync, callback wiring).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'

// ─── Top-level mutation mocks (must be defined before vi.mock) ────────────────

const mockRefetch       = vi.fn()
const mockApprove       = vi.fn()
const mockReject        = vi.fn()
const mockClarify       = vi.fn()
const mockFlagPhysical  = vi.fn()
const mockMarkRead      = vi.fn()
const mockMarkAllRead   = vi.fn()

// ─── Mock dcApi module ────────────────────────────────────────────────────────

vi.mock('@/features/dc/dcApi', () => ({
  dcApi: {
    reducerPath: 'dcApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
    util: {
      resetApiState: () => ({ type: 'dcApi/resetApiState' }),
    },
  },
  useGetDcDashboardQuery:              vi.fn(),
  useSearchDcTemplesQuery:             vi.fn(),
  useGetDcNotificationsQuery:          vi.fn(),
  useGetDcUnreadCountQuery:            vi.fn(),
  useMarkNotificationReadMutation:     vi.fn(),
  useMarkAllNotificationsReadMutation: vi.fn(),
  useApproveProfileMutation:           vi.fn(),
  useRejectProfileMutation:            vi.fn(),
  useGetDcTempleProfileQuery:          vi.fn(),
  useGetDcPendingProfileStagingQuery:  vi.fn(),
  useGetDcDeclarationDetailQuery:      vi.fn(),
  useGetDcContextQuery:                vi.fn().mockReturnValue({
    data: { success: true, message: 'OK', data: { role: 'DISTRICT_COLLECTOR', districtId: null, cityId: null } },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

// ─── Mock governanceApi module (workflow mutations) ───────────────────────────

vi.mock('@/features/governance/governanceApi', () => ({
  governanceApi: {
    reducerPath: 'governanceApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useApproveDeclarationMutation:        vi.fn(),
  useRejectDeclarationMutation:         vi.fn(),
  useClarifyDeclarationMutation:        vi.fn(),
  useFlagPhysicalVerificationMutation:  vi.fn(),
  useMarkUnderReviewDeclarationMutation: vi.fn(),
}))

// ─── Mock declarationApi module (schedule-site-visit mutation) ────────────────

vi.mock('@/features/declaration/declarationApi', () => ({
  declarationApi: {
    reducerPath: 'declarationApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useScheduleSiteVisitMutation: vi.fn(),
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
  useSearchDcTemplesQuery,
} from '@/features/dc/dcApi'
import {
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  useMarkUnderReviewDeclarationMutation,
} from '@/features/governance/governanceApi'
import { useScheduleSiteVisitMutation } from '@/features/declaration/declarationApi'

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

  beforeEach(() => { vi.mocked(useGetDcDashboardQuery).mockReset() })

  it('should_returnDashboardData_when_querySucceeds', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockDashboard },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useGetDcDashboardQuery>)

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.dashboard).toEqual(mockDashboard)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.refetch).toBe(mockRefetch)
  })

  it('should_returnNullDashboard_when_isLoading', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    } as ReturnType<typeof useGetDcDashboardQuery>)

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.dashboard).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('should_setIsError_when_queryFails', () => {
    vi.mocked(useGetDcDashboardQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as ReturnType<typeof useGetDcDashboardQuery>)

    const { result } = renderHook(() => useDcDashboard(), { wrapper: Wrapper })

    expect(result.current.isError).toBe(true)
    expect(result.current.dashboard).toBeNull()
  })
})

// ─── useDcNotifications ───────────────────────────────────────────────────────

describe('useDcNotifications', () => {
  const mockNotifications = [
    { id: 1, title: 'Approved',  body: 'Approved',  referenceType: 'ASSET_DECLARATION', referenceId: 42, read: false, readAt: null,                   createdAt: '2026-04-09T10:00:00' },
    { id: 2, title: 'Clarify',   body: 'Clarify',   referenceType: 'ASSET_DECLARATION', referenceId: 43, read: true,  readAt: '2026-04-09T11:00:00', createdAt: '2026-04-09T09:00:00' },
  ]

  beforeEach(() => {
    vi.mocked(useGetDcNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: mockNotifications, page: 0, size: 10, totalElements: 2, totalPages: 1, last: true } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGetDcNotificationsQuery>)

    vi.mocked(useGetDcUnreadCountQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: 1 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGetDcUnreadCountQuery>)

    vi.mocked(useMarkNotificationReadMutation).mockReturnValue(
      [mockMarkRead, { isLoading: false }] as ReturnType<typeof useMarkNotificationReadMutation>
    )
    vi.mocked(useMarkAllNotificationsReadMutation).mockReturnValue(
      [mockMarkAllRead, { isLoading: false }] as ReturnType<typeof useMarkAllNotificationsReadMutation>
    )
  })

  it('should_returnNotificationsAndUnreadCount_when_queriesSucceed', () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.total).toBe(2)
    expect(result.current.unreadCount).toBe(1)
    expect(result.current.isError).toBe(false)
  })

  it('should_callMarkReadMutation_when_onMarkReadIsInvoked', () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    act(() => { result.current.onMarkRead(1) })

    expect(mockMarkRead).toHaveBeenCalledWith(1)
  })

  it('should_callMarkAllReadMutation_when_onMarkAllReadIsInvoked', () => {
    const { result } = renderHook(() => useDcNotifications(0, 10), { wrapper: Wrapper })

    act(() => { result.current.onMarkAllRead() })

    expect(mockMarkAllRead).toHaveBeenCalled()
  })
})

// ─── useDcTempleSearch ────────────────────────────────────────────────────────

describe('useDcTempleSearch', () => {

    it('should_resetStateAndCache_when_userSwitches', () => {
      // Simulate two users with different districtIds
      const userA = { userId: 1, username: 'mandya', districtId: 101, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }
      const userB = { userId: 2, username: 'mysuru', districtId: 202, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }

      // Mock Redux store with userA, then switch to userB
      const store = buildStore()
      store.dispatch({ type: 'auth/setCurrentUser', payload: userA })

      // Initial render with userA
      const { result, rerender } = renderHook(() => useDcTempleSearch(), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <MemoryRouter initialEntries={['/?page=2&districtId=101']}>{children}</MemoryRouter>
          </Provider>
        ),
      })

      // Should call query with userA's districtId
      expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({ districtId: 101, userId: 1 }),
        expect.anything()
      )

      // Switch to userB
      act(() => {
        store.dispatch({ type: 'auth/setCurrentUser', payload: userB })
      })
      rerender()

      // Should reset RTK Query cache (resetApiState called)
      // Should reset URL params to userB's districtId
      expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({ districtId: 202, userId: 2, page: 0 }),
        expect.anything()
      )
    })

    it('should_notRenderStaleData_when_userSwitchesRapidly', () => {
      const userA = { userId: 1, username: 'mandya', districtId: 101, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }
      const userB = { userId: 2, username: 'mysuru', districtId: 202, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }
      const store = buildStore()
      store.dispatch({ type: 'auth/setCurrentUser', payload: userA })

      // Simulate rapid switch
      const { rerender } = renderHook(() => useDcTempleSearch(), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <MemoryRouter initialEntries={['/?districtId=101']}>{children}</MemoryRouter>
          </Provider>
        ),
      })
      act(() => {
        store.dispatch({ type: 'auth/setCurrentUser', payload: userB })
      })
      rerender()
      // After switch, the last call should use userB's data
      expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({ districtId: 202, userId: 2 }),
        expect.anything()
      )
    })

    it('should_resetUrlParams_when_userSwitches', () => {
      const userA = { userId: 1, username: 'mandya', districtId: 101, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }
      const userB = { userId: 2, username: 'mysuru', districtId: 202, role: 'DISTRICT_COLLECTOR', aadhaarVerified: true }
      const store = buildStore()
      store.dispatch({ type: 'auth/setCurrentUser', payload: userA })

      // Start on page 5 with userA
      const { result, rerender } = renderHook(() => useDcTempleSearch(), {
        wrapper: ({ children }) => (
          <Provider store={store}>
            <MemoryRouter initialEntries={['/?page=5&districtId=101']}>{children}</MemoryRouter>
          </Provider>
        ),
      })

      // Switch to userB
      act(() => {
        store.dispatch({ type: 'auth/setCurrentUser', payload: userB })
      })
      rerender()

      // Should reset page param to 0 and districtId to userB's
      expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
        expect.objectContaining({ districtId: 202, page: 0, userId: 2 }),
        expect.anything()
      )
    })
  const emptyPage = { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, last: true }

  beforeEach(() => {
    vi.mocked(useSearchDcTemplesQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: emptyPage },
      isLoading: false,
      isError: false,
      isFetching: false,
    } as ReturnType<typeof useSearchDcTemplesQuery>)
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
      expect.anything()
    )
  })

  it('should_passKeywordToQuery_when_applyFiltersIsCalled', () => {
    const { result } = renderHook(() => useDcTempleSearch(), { wrapper: Wrapper })

    act(() => { result.current.applyFilters({ keyword: 'shiva' }) })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: 'shiva' }),
      expect.anything()
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

    act(() => { result.current.applyFilters({ keyword: 'rama' }) })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0 }),
      expect.anything()
    )
  })

  it('should_setPageParam_when_goToPageIsCalled', () => {
    const { result } = renderHook(() => useDcTempleSearch(), { wrapper: Wrapper })

    act(() => { result.current.goToPage(4) })

    expect(vi.mocked(useSearchDcTemplesQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ page: 4 }),
      expect.anything()
    )
  })
})

// ─── useWorkflowActions ───────────────────────────────────────────────────────

describe('useWorkflowActions', () => {
  const mockApproveUnwrap = vi.fn()
  const mockRejectUnwrap  = vi.fn()

  beforeEach(() => {
    mockApprove.mockReturnValue({ unwrap: mockApproveUnwrap.mockResolvedValue({ data: { acknowledgementNumber: 'ACK-001' }, message: 'Approved.' }) })
    mockReject.mockReturnValue({  unwrap: mockRejectUnwrap.mockResolvedValue({ message: 'Rejected.' }) })
    mockClarify.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ message: 'Clarification requested.' }) })
    mockFlagPhysical.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ message: 'Flagged.' }) })

    vi.mocked(useApproveDeclarationMutation).mockReturnValue(
      [mockApprove, { isLoading: false }] as ReturnType<typeof useApproveDeclarationMutation>
    )
    vi.mocked(useRejectDeclarationMutation).mockReturnValue(
      [mockReject, { isLoading: false }] as ReturnType<typeof useRejectDeclarationMutation>
    )
    vi.mocked(useClarifyDeclarationMutation).mockReturnValue(
      [mockClarify, { isLoading: false }] as ReturnType<typeof useClarifyDeclarationMutation>
    )
    vi.mocked(useFlagPhysicalVerificationMutation).mockReturnValue(
      [mockFlagPhysical, { isLoading: false }] as ReturnType<typeof useFlagPhysicalVerificationMutation>
    )
    vi.mocked(useMarkUnderReviewDeclarationMutation).mockReturnValue(
      [vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) }), { isLoading: false }] as ReturnType<typeof useMarkUnderReviewDeclarationMutation>
    )
    vi.mocked(useScheduleSiteVisitMutation).mockReturnValue(
      [vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ message: 'Site visit scheduled.' }) }), { isLoading: false }] as ReturnType<typeof useScheduleSiteVisitMutation>
    )
  })

  it('should_openDialog_with_correctKindAndId_when_openDialogIsCalled', () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    expect(result.current.dialog.open).toBe(false)
    expect(result.current.dialog.kind).toBeNull()

    act(() => { result.current.openDialog('approve', 42) })

    expect(result.current.dialog.open).toBe(true)
    expect(result.current.dialog.kind).toBe('approve')
    expect(result.current.dialog.declarationId).toBe(42)
  })

  it('should_closeDialog_and_resetState_when_closeDialogIsCalled', () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => result.current.openDialog('reject', 10))
    act(() => result.current.closeDialog())

    expect(result.current.dialog.open).toBe(false)
    expect(result.current.dialog.kind).toBeNull()
    expect(result.current.dialog.declarationId).toBeNull()
  })

  it('should_notCallMutation_when_declarationIdIsNull_onConfirmApprove', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    // declarationId is null — never opened dialog
    await act(async () => { await result.current.confirmApprove({ notes: '' }) })

    expect(mockApprove).not.toHaveBeenCalled()
  })

  it('should_callApproveMutation_with_correctArgs_when_confirmApproveIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => result.current.openDialog('approve', 42))

    await act(async () => { await result.current.confirmApprove({ notes: 'LGTM' }) })

    expect(mockApprove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 42, body: { notes: 'LGTM' } })
    )
    // Dialog closed after success
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_callRejectMutation_with_correctArgs_when_confirmRejectIsInvoked', async () => {
    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    act(() => result.current.openDialog('reject', 99))

    await act(async () => { await result.current.confirmReject({ reason: 'Missing docs' }) })

    expect(mockReject).toHaveBeenCalledWith(
      expect.objectContaining({ id: 99, body: { reason: 'Missing docs' } })
    )
    expect(result.current.dialog.open).toBe(false)
  })

  it('should_returnIsSubmittingTrue_when_anyMutationIsLoading', () => {
    vi.mocked(useApproveDeclarationMutation).mockReturnValue(
      [mockApprove, { isLoading: true }] as ReturnType<typeof useApproveDeclarationMutation>
    )

    const { result } = renderHook(() => useWorkflowActions(), { wrapper: Wrapper })

    expect(result.current.isSubmitting).toBe(true)
  })
})
