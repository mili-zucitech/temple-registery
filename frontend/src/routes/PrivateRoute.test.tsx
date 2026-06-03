import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { PrivateRoute } from './PrivateRoute'

// Mock the Redux store hooks
vi.mock('@/app/store', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: () => vi.fn(),
}))

// Mock the RTK Query hook
vi.mock('@/features/auth/authApi', () => ({
  useGetCurrentUserQuery: vi.fn(),
}))

// Mock the permissions API — PermissionsProvider is rendered inside PrivateRoute
vi.mock('@/features/access-control/accessControlApi', () => ({
  useGetMyPermissionsQuery: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
  accessControlApi: { reducerPath: 'accessControlApi', middleware: () => (next: unknown) => next },
}))

import { useAppSelector } from '@/app/store'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'

const mockUseAppSelector = vi.mocked(useAppSelector)
const mockUseGetCurrentUserQuery = vi.mocked(useGetCurrentUserQuery)

const TestOutlet = () => <div>Protected Content</div>

function renderPrivateRoute() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<PrivateRoute />}>
          <Route path="/protected" element={<TestOutlet />} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PrivateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should_showSpinner_when_loadingAndNotAuthenticated', () => {
    mockUseAppSelector.mockReturnValue(false)
    mockUseGetCurrentUserQuery.mockReturnValue({ data: undefined, isLoading: true } as ReturnType<typeof useGetCurrentUserQuery>)

    renderPrivateRoute()

    // The spinner div should be present (identified by the animate-spin class)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should_renderOutlet_when_authenticated', () => {
    mockUseAppSelector.mockReturnValue(true)
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { data: { id: 1, username: 'user', role: 'TEMPLE_AUTHORITY' } },
      isLoading: false,
    } as ReturnType<typeof useGetCurrentUserQuery>)

    renderPrivateRoute()

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should_redirectToLogin_when_notAuthenticatedAndNoData', () => {
    mockUseAppSelector.mockReturnValue(false)
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof useGetCurrentUserQuery>)

    renderPrivateRoute()

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should_renderOutlet_when_serverReturnsUserData', () => {
    // Not authenticated in Redux but data came back from server
    mockUseAppSelector.mockReturnValue(false)
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { data: { id: 1, username: 'admin', role: 'SUPER_ADMIN' } },
      isLoading: false,
    } as ReturnType<typeof useGetCurrentUserQuery>)

    renderPrivateRoute()

    // Has data.data so should render protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })
})
