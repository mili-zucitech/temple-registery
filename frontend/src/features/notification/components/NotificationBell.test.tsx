/**
 * Unit tests for NotificationBell component.
 *
 * Mocks RTK Query and child components to keep tests focused on:
 *   - Badge rendering when there are unread notifications
 *   - Badge hidden when count is zero
 *   - aria-label reflects unread count
 *   - "9+" cap on badge display
 *   - Popover trigger interaction calls refetch
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import type { ReactNode } from 'react'
import { rootReducer } from '@/app/rootReducer'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRefetch = vi.fn()

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
}))

// NotificationDropdown is a heavy component — stub it out
vi.mock('./NotificationDropdown', () => ({
  NotificationDropdown: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="notification-dropdown">
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

import { useNotifications } from '../hooks/useNotifications'
import { NotificationBell } from './NotificationBell'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildStore() {
  return configureStore({ reducer: rootReducer })
}

function Wrapper({ children }: { children: ReactNode }) {
  const store = buildStore()
  return <Provider store={store}>{children}</Provider>
}

function renderBell() {
  return render(<NotificationBell />, { wrapper: Wrapper })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 0,
      refetch: mockRefetch,
    } as ReturnType<typeof useNotifications>)
  })

  it('should_notShowBadge_when_unreadCountIsZero', () => {
    renderBell()

    expect(screen.queryByText(/^\d/)).toBeNull()
  })

  it('should_showBadgeWithCount_when_thereAreUnreadNotifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 3,
      refetch: mockRefetch,
    } as ReturnType<typeof useNotifications>)

    renderBell()

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should_showNinePlusBadge_when_unreadCountExceedsNine', () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 15,
      refetch: mockRefetch,
    } as ReturnType<typeof useNotifications>)

    renderBell()

    expect(screen.getByText('9+')).toBeInTheDocument()
  })

  it('should_includeUnreadCountInAriaLabel_when_thereAreUnreadNotifications', () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 5,
      refetch: mockRefetch,
    } as ReturnType<typeof useNotifications>)

    renderBell()

    const button = screen.getByRole('button', { name: /notifications/i })
    expect(button).toHaveAttribute('aria-label', 'Notifications (5 unread)')
  })

  it('should_callRefetch_when_popoverIsOpened', () => {
    vi.mocked(useNotifications).mockReturnValue({
      unreadCount: 2,
      refetch: mockRefetch,
    } as ReturnType<typeof useNotifications>)

    renderBell()

    const trigger = screen.getByRole('button', { name: /notifications/i })
    fireEvent.click(trigger)

    expect(mockRefetch).toHaveBeenCalled()
  })
})
