/**
 * Unit tests for useNotificationDropdown hook.
 *
 * Network calls are mocked at the module level to keep tests
 * focused on hook logic — state, computed values, and callback wiring.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRefetch              = vi.fn()
const mockMarkAllRead          = vi.fn()
const mockDeleteNotification   = vi.fn()
const mockClearAll             = vi.fn()

vi.mock('../notificationApi', () => ({
  notificationApi: {
    reducerPath: 'notificationApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useListNotificationsQuery:       vi.fn(),
  useMarkAllReadMutation:          vi.fn(),
  useDeleteNotificationMutation:   vi.fn(),
  useClearAllNotificationsMutation: vi.fn(),
}))

import {
  useListNotificationsQuery,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
} from '../notificationApi'
import { useNotificationDropdown } from './useNotificationDropdown'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStore() {
  return configureStore({ reducer: rootReducer })
}

function Wrapper({ children }: { children: ReactNode }) {
  const store = buildStore()
  return <Provider store={store}>{children}</Provider>
}

const unreadNotification = {
  id: 1, title: 'Approved', body: 'Declaration approved',
  referenceType: 'DECLARATION', referenceId: 10,
  read: false, readAt: null, createdAt: '2026-05-01T10:00:00',
}
const readNotification = {
  id: 2, title: 'Clarify', body: 'Clarification required',
  referenceType: 'DECLARATION', referenceId: 11,
  read: true, readAt: '2026-05-01T11:00:00', createdAt: '2026-05-01T09:00:00',
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useNotificationDropdown', () => {
  beforeEach(() => {
    vi.mocked(useMarkAllReadMutation).mockReturnValue(
      [mockMarkAllRead, { isLoading: false }] as ReturnType<typeof useMarkAllReadMutation>
    )
    vi.mocked(useDeleteNotificationMutation).mockReturnValue(
      [mockDeleteNotification, { isLoading: false }] as ReturnType<typeof useDeleteNotificationMutation>
    )
    vi.mocked(useClearAllNotificationsMutation).mockReturnValue(
      [mockClearAll, { isLoading: false }] as ReturnType<typeof useClearAllNotificationsMutation>
    )
  })

  it('should_returnNotificationsAndHasUnread_when_querySucceeds', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [unreadNotification, readNotification], page: 0, size: 8, totalElements: 2, totalPages: 1, last: true } },
      isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    expect(result.current.notifications).toHaveLength(2)
    expect(result.current.hasUnread).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('should_setHasUnreadFalse_when_allNotificationsAreRead', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [readNotification], page: 0, size: 8, totalElements: 1, totalPages: 1, last: true } },
      isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    expect(result.current.hasUnread).toBe(false)
  })

  it('should_returnEmptyNotifications_when_dataIsUndefined', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined, isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    expect(result.current.notifications).toEqual([])
    expect(result.current.hasUnread).toBe(false)
  })

  it('should_setIsError_when_queryFails', () => {
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    expect(result.current.isError).toBe(true)
    expect(result.current.notifications).toEqual([])
  })

  it('should_callMarkAllReadAndRefetch_when_handleMarkAllReadInvoked', async () => {
    mockMarkAllRead.mockReturnValueOnce({ unwrap: () => Promise.resolve({ data: {} }) })
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [unreadNotification], page: 0, size: 8, totalElements: 1, totalPages: 1, last: true } },
      isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    await act(async () => { await result.current.handleMarkAllRead() })

    expect(mockMarkAllRead).toHaveBeenCalled()
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('should_callDeleteNotification_when_handleDeleteInvoked', async () => {
    mockDeleteNotification.mockReturnValueOnce({ unwrap: () => Promise.resolve({}) })
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [unreadNotification], page: 0, size: 8, totalElements: 1, totalPages: 1, last: true } },
      isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    await act(async () => { await result.current.handleDelete(1) })

    expect(mockDeleteNotification).toHaveBeenCalledWith(1)
  })

  it('should_callClearAll_when_handleClearAllInvoked', async () => {
    mockClearAll.mockReturnValueOnce({ unwrap: () => Promise.resolve({}) })
    vi.mocked(useListNotificationsQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [unreadNotification], page: 0, size: 8, totalElements: 1, totalPages: 1, last: true } },
      isLoading: false, isError: false, refetch: mockRefetch,
    } as ReturnType<typeof useListNotificationsQuery>)

    const { result } = renderHook(() => useNotificationDropdown(), { wrapper: Wrapper })

    await act(async () => { await result.current.handleClearAll() })

    expect(mockClearAll).toHaveBeenCalled()
  })
})
