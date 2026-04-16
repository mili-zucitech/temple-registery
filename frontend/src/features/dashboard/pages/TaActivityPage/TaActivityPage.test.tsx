import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TaActivityPage } from './TaActivityPage'
import type { NotificationResponse } from '@/features/notification/notificationApi'

// ─── Module-level mocks ───────────────────────────────────────────────────────

const mockMarkRead    = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) })
const mockMarkAllRead = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) })

vi.mock('@/features/notification/notificationApi', () => ({
  notificationApi: {
    reducerPath: 'notificationApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useListNotificationsQuery: vi.fn(),
  useMarkReadMutation:       vi.fn(),
  useMarkAllReadMutation:    vi.fn(),
}))

import {
  useListNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '@/features/notification/notificationApi'

const mockList        = vi.mocked(useListNotificationsQuery)
const mockMarkReadHook    = vi.mocked(useMarkReadMutation)
const mockMarkAllReadHook = vi.mocked(useMarkAllReadMutation)

const makeNotification = (overrides: Partial<NotificationResponse>): NotificationResponse => ({
  id: 1,
  title: 'Profile Approved',
  body: 'Your temple profile has been approved by the District Collector.',
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaActivityPage', () => {
  beforeEach(() => {
    mockMarkReadHook.mockReturnValue([mockMarkRead, { isLoading: false }] as ReturnType<typeof useMarkReadMutation>)
    mockMarkAllReadHook.mockReturnValue([mockMarkAllRead, { isLoading: false }] as ReturnType<typeof useMarkAllReadMutation>)
  })

  it('should_renderSkeletons_when_notificationsAreLoading', () => {
    mockList.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    expect(screen.queryByRole('button', { name: /Mark all read/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Profile Approved/i)).not.toBeInTheDocument()
  })

  it('should_renderEmptyState_when_noNotificationsExist', () => {
    mockList.mockReturnValue({
      data: { data: { content: [], totalPages: 0, totalElements: 0 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument()
  })

  it('should_renderNotificationItems_when_dataIsPresent', async () => {
    const notifications: NotificationResponse[] = [
      makeNotification({ id: 1, title: 'Profile Approved', body: 'Your profile was approved.', read: false }),
      makeNotification({ id: 2, title: 'Clarification Requested', body: 'DC requests clarification.', read: true }),
    ]

    mockList.mockReturnValue({
      data: { data: { content: notifications, totalPages: 1, totalElements: 2 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    await waitFor(() => {
      expect(screen.getByText('Profile Approved')).toBeInTheDocument()
      expect(screen.getByText('Clarification Requested')).toBeInTheDocument()
    })
  })

  it('should_showMarkAllReadButton_when_unreadNotificationsExist', async () => {
    const notifications: NotificationResponse[] = [
      makeNotification({ id: 1, title: 'Profile Approved', read: false }),
      makeNotification({ id: 2, title: 'Submission Received', read: false }),
    ]

    mockList.mockReturnValue({
      data: { data: { content: notifications, totalPages: 1, totalElements: 2 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Mark all read/i })).toBeInTheDocument()
    })
  })

  it('should_callMarkAllRead_when_markAllReadButtonClicked', async () => {
    const user = userEvent.setup()
    const notifications: NotificationResponse[] = [
      makeNotification({ id: 1, title: 'Profile Approved', read: false }),
    ]

    mockList.mockReturnValue({
      data: { data: { content: notifications, totalPages: 1, totalElements: 1 } },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useListNotificationsQuery>)

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    const btn = await screen.findByRole('button', { name: /Mark all read/i })
    await user.click(btn)

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1)
  })
})
