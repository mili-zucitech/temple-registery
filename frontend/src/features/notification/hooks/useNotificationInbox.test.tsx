/**
 * Unit tests for useNotificationInbox hook.
 *
 * Mocks RTK Query at the module level so tests stay focused on
 * the derived values and mutation wiring the hook exposes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockMarkAllRead = vi.fn()

vi.mock('../notificationApi', () => ({
  notificationApi: {
    reducerPath: 'notificationApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useListNotificationsQuery: vi.fn(),
  useMarkAllReadMutation:    vi.fn(),
}))

import { useListNotificationsQuery, useMarkAllReadMutation } from '../notificationApi'
import { useNotificationInbox } from './useNotificationInbox'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStore() {
  return configureStore({ reducer: rootReducer })
}

function Wrapper({ children }: { children: ReactNode }) {
  const store = buildStore()
  return <Provider store={store}>{children}</Provider>
}

const notifications = [
  { id: 1, title: 'Approved', body: 'Declaration approved', referenceType: 'DECLARATION', referenceId: 10, read: false, readAt: null, createdAt: '2026-05-01T10:00:00' },
  { id: 2, title: 'Rejected', body: 'Declaration rejected', referenceType: 'DECLARATION', referenceId: 11, read: true,  readAt: '2026-05-01T11:00:00', createdAt: '2026-05-01T09:00:00' },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useNotificationInbox', () => {
  beforeEach(() => {
    vi.mocked(useMarkAllReadMutation).mockReturnValue(
      [mockMarkAllRead, { isLoading: false }] as ReturnType<typeof useMarkAllReadMutation>
    )
  })

  it('should_returnNotificationsAndPagination_when_querySucceeds', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: notifications, page: 0, size: 20, totalElements: 2, totalPages: 1, last: true } },
      isLoading: false,
      isFetching: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationInbox(0), { wrapper: Wrapper })

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.totalElements).toBe(2)
    expect(result.current.totalPages).toBe(1)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should_returnEmptyArrayAndZeroPagination_when_dataIsUndefined', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationInbox(0), { wrapper: Wrapper })

    expect(result.current.notifications).toEqual([])
    expect(result.current.totalElements).toBe(0)
    expect(result.current.totalPages).toBe(0)
  })

  it('should_setIsLoading_when_queryIsInFlight', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationInbox(0), { wrapper: Wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isFetching).toBe(true)
  })

  it('should_setIsError_when_queryFails', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationInbox(0), { wrapper: Wrapper })

    expect(result.current.isError).toBe(true)
  })

  it('should_passPageParamToQuery_when_pageChanges', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderHook(() => useNotificationInbox(3), { wrapper: Wrapper })

    expect(vi.mocked(useListNotificationsQuery)).toHaveBeenCalledWith(
      expect.objectContaining({ page: 3, size: 20 })
    )
  })

  it('should_exposeMarkAllRead_when_callerInvokesIt', async () => {
    mockMarkAllRead.mockResolvedValueOnce({ data: {} })
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: notifications, page: 0, size: 20, totalElements: 2, totalPages: 1, last: true } },
      isLoading: false,
      isFetching: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationInbox(0), { wrapper: Wrapper })

    await act(async () => {
      await result.current.markAllRead()
    })

    expect(mockMarkAllRead).toHaveBeenCalled()
  })
})
