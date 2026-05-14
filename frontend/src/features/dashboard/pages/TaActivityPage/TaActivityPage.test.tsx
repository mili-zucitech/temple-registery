import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TaActivityPage } from './TaActivityPage'
import type { NotificationResponse } from '@/features/notification/notificationApi'

// ─── Module-level mocks ───────────────────────────────────────────────────────

const mockMarkRead    = vi.fn()
const mockMarkAllRead = vi.fn()

vi.mock('./useTaActivity', () => ({
  useTaActivity: vi.fn(),
}))

import { useTaActivity } from './useTaActivity'

const mockUseTaActivity = vi.mocked(useTaActivity)

const makeNotification = (overrides: Partial<NotificationResponse>): NotificationResponse => ({
  id: 1,
  title: 'Profile Approved',
  body: 'Your temple profile has been approved by the District Collector.',
  read: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const defaultHookReturn = {
  notifications: [],
  totalPages: 0,
  totalElements: 0,
  unreadCount: 0,
  isLoading: false,
  isError: false,
  isMarking: false,
  isMarkingAll: false,
  markRead: mockMarkRead,
  markAllRead: mockMarkAllRead,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaActivityPage', () => {
  beforeEach(() => {
    mockUseTaActivity.mockReturnValue(defaultHookReturn)
    mockMarkRead.mockClear()
    mockMarkAllRead.mockClear()
  })

  it('should_renderSkeletons_when_notificationsAreLoading', () => {
    mockUseTaActivity.mockReturnValue({ ...defaultHookReturn, isLoading: true })

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    expect(screen.queryByRole('button', { name: /Mark all read/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/Profile Approved/i)).not.toBeInTheDocument()
  })

  it('should_renderEmptyState_when_noNotificationsExist', () => {
    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument()
  })

  it('should_renderNotificationItems_when_dataIsPresent', async () => {
    const notifications: NotificationResponse[] = [
      makeNotification({ id: 1, title: 'Profile Approved', body: 'Your profile was approved.', read: false }),
      makeNotification({ id: 2, title: 'Clarification Requested', body: 'DC requests clarification.', read: true }),
    ]

    mockUseTaActivity.mockReturnValue({
      ...defaultHookReturn,
      notifications,
      totalPages: 1,
      totalElements: 2,
      unreadCount: 1,
    })

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

    mockUseTaActivity.mockReturnValue({
      ...defaultHookReturn,
      notifications,
      totalPages: 1,
      totalElements: 2,
      unreadCount: 2,
    })

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

    mockUseTaActivity.mockReturnValue({
      ...defaultHookReturn,
      notifications,
      totalPages: 1,
      totalElements: 1,
      unreadCount: 1,
    })

    renderWithProviders(<TaActivityPage />, { initialRoute: '/ta/activity' })

    const btn = await screen.findByRole('button', { name: /Mark all read/i })
    await user.click(btn)

    expect(mockMarkAllRead).toHaveBeenCalledTimes(1)
  })
})
