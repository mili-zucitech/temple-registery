import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { RoleRoute } from './RoleRoute'

vi.mock('@/app/store', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: () => vi.fn(),
}))

vi.mock('@/features/auth/authApi', () => ({
  useGetCurrentUserQuery: vi.fn(),
}))

import { useAppSelector } from '@/app/store'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'

const mockUseAppSelector = vi.mocked(useAppSelector)
const mockUseGetCurrentUserQuery = vi.mocked(useGetCurrentUserQuery)

const TestOutlet = () => <div>Role Restricted Content</div>

function renderRoleRoute(allowedRoles: string[]) {
  return render(
    <MemoryRouter initialEntries={['/restricted']}>
      <Routes>
        <Route element={<RoleRoute allowedRoles={allowedRoles as never} />}>
          <Route path="/restricted" element={<TestOutlet />} />
        </Route>
        <Route path="/403" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should_renderOutlet_when_userRoleIsAllowed', () => {
    mockUseAppSelector.mockReturnValue({ role: 'TEMPLE_AUTHORITY' })
    mockUseGetCurrentUserQuery.mockReturnValue({ data: undefined } as ReturnType<typeof useGetCurrentUserQuery>)

    renderRoleRoute(['TEMPLE_AUTHORITY', 'SUPER_ADMIN'])

    expect(screen.getByText('Role Restricted Content')).toBeInTheDocument()
  })

  it('should_redirectTo403_when_userRoleNotAllowed', () => {
    mockUseAppSelector.mockReturnValue({ role: 'TEMPLE_AUTHORITY' })
    mockUseGetCurrentUserQuery.mockReturnValue({ data: undefined } as ReturnType<typeof useGetCurrentUserQuery>)

    renderRoleRoute(['SUPER_ADMIN', 'DC'])

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
    expect(screen.queryByText('Role Restricted Content')).not.toBeInTheDocument()
  })

  it('should_returnNull_when_roleNotResolved', () => {
    // No current user in Redux and no API data yet
    mockUseAppSelector.mockReturnValue(null)
    mockUseGetCurrentUserQuery.mockReturnValue({ data: undefined } as ReturnType<typeof useGetCurrentUserQuery>)

    const { container } = renderRoleRoute(['TEMPLE_AUTHORITY'])

    // Renders nothing while auth resolves
    expect(screen.queryByText('Role Restricted Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Unauthorized Page')).not.toBeInTheDocument()
    // container may be empty since RoleRoute returns null
    expect(container).toBeDefined()
  })

  it('should_fallbackToApiData_when_reduxStateIsNull', () => {
    mockUseAppSelector.mockReturnValue(null)
    mockUseGetCurrentUserQuery.mockReturnValue({
      data: { data: { id: 1, username: 'dc_user', role: 'DC' } },
    } as ReturnType<typeof useGetCurrentUserQuery>)

    renderRoleRoute(['DC', 'SUPER_ADMIN'])

    expect(screen.getByText('Role Restricted Content')).toBeInTheDocument()
  })
})
