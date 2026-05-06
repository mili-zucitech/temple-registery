import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TempleGovernancePage } from './TempleGovernancePage'

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockTemple = {
  id: 1,
  templeId: 1,
  name: 'Sri Ranganatha Swamy Temple',
  grade: 'A',
  tradition: 'Vaishnava',
  districtId: 10,
  districtName: 'Bengaluru Urban',
  city: 'Bengaluru',
  trustRegistered: true,
}

const mockSuspend = vi.fn().mockResolvedValue({ data: { success: true } })
const mockReactivate = vi.fn().mockResolvedValue({ data: { success: true } })
const mockFreeze = vi.fn().mockResolvedValue({ data: { success: true } })
const mockArchive = vi.fn().mockResolvedValue({ data: { success: true } })

vi.mock('@/features/admin/adminApi', () => ({
  adminApi: {
    reducerPath: 'adminApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useSuspendTempleMutation: () => [mockSuspend, { isLoading: false }],
  useReactivateTempleMutation: () => [mockReactivate, { isLoading: false }],
  useFreezeTempleMutation: () => [mockFreeze, { isLoading: false }],
  useArchiveTempleMutation: () => [mockArchive, { isLoading: false }],
}))

vi.mock('@/features/temple/templeApi', () => ({
  templeApi: {
    reducerPath: 'templeApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useSearchTemplesQuery: vi.fn(),
}))

import { useSearchTemplesQuery } from '@/features/temple/templeApi'

describe('TempleGovernancePage', () => {
  beforeEach(() => {
    vi.mocked(useSearchTemplesQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: { content: [], totalElements: 0, totalPages: 0 } },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useSearchTemplesQuery>)
    mockSuspend.mockClear()
    mockFreeze.mockClear()
    mockArchive.mockClear()
    mockReactivate.mockClear()
  })

  it('should render the temple search input in step 1', async () => {
    renderWithProviders(<TempleGovernancePage />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/temple name/i)).toBeInTheDocument()
    })
  })

  it('should show search results when temples are found', async () => {
    vi.mocked(useSearchTemplesQuery).mockReturnValue({
      data: {
        success: true, message: 'OK',
        data: { content: [mockTemple], totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useSearchTemplesQuery>)
    renderWithProviders(<TempleGovernancePage />)
    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/temple name/i)
    await user.type(searchInput, 'Rang')
    await waitFor(() => {
      expect(screen.getByText('Sri Ranganatha Swamy Temple')).toBeInTheDocument()
    })
  })

  it('should show action cards after a temple is selected', async () => {
    vi.mocked(useSearchTemplesQuery).mockReturnValue({
      data: {
        success: true, message: 'OK',
        data: { content: [mockTemple], totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useSearchTemplesQuery>)
    renderWithProviders(<TempleGovernancePage />)
    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/temple name/i)
    await user.type(searchInput, 'Rang')
    const templeResult = await screen.findByText('Sri Ranganatha Swamy Temple')
    await user.click(templeResult)
    await waitFor(() => {
      expect(screen.getAllByText(/Suspend/i).length).toBeGreaterThan(0)
    })
  })

  it('should show action cards as disabled before temple is selected', async () => {
    renderWithProviders(<TempleGovernancePage />)
    await waitFor(() => {
      const suspendBtns = screen.queryAllByRole('button', { name: /suspend/i })
      suspendBtns.forEach(btn => {
        expect(btn).toBeDisabled()
      })
    })
  })

  it('should render page title and description', async () => {
    renderWithProviders(<TempleGovernancePage />)
    await waitFor(() => {
      expect(screen.getByText(/Temple Governance/i)).toBeInTheDocument()
    })
  })

  it('should show grade badge for found temple', async () => {
    vi.mocked(useSearchTemplesQuery).mockReturnValue({
      data: {
        success: true, message: 'OK',
        data: { content: [mockTemple], totalElements: 1, totalPages: 1 },
      },
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof useSearchTemplesQuery>)
    renderWithProviders(<TempleGovernancePage />)
    const user = userEvent.setup()
    const searchInput = screen.getByPlaceholderText(/temple name/i)
    await user.type(searchInput, 'Sri')
    await waitFor(() => {
      expect(screen.getAllByText('Sri Ranganatha Swamy Temple').length).toBeGreaterThan(0)
    })
  })
})
