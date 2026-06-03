import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { GeoManagementPage } from './GeoManagementPage'

// ── Mock data ──────────────────────────────────────────────────────────────────

const mockStates = [
  { id: 1, name: 'Karnataka', code: 'KA' },
  { id: 2, name: 'Tamil Nadu', code: 'TN' },
]
const mockDistricts = [
  { id: 10, name: 'Bengaluru Urban', stateId: 1, cityId: 5 },
]
const mockTaluks = [{ id: 20, name: 'Anekal', districtId: 10 }]
const mockHoblis = [{ id: 30, name: 'Anekal Hobli', talukId: 20 }]

const mockCreateState = vi.fn().mockResolvedValue({ data: { success: true, data: { id: 99, name: 'NewState', code: 'NS' } } })
const mockCreateCity = vi.fn().mockResolvedValue({ data: { success: true, data: { id: 5, name: 'KA City', stateId: 1 } } })
const mockCreateDistrict = vi.fn().mockResolvedValue({ data: { success: true, data: { id: 10, name: 'New District', cityId: 5 } } })
const mockCreateTaluk = vi.fn().mockResolvedValue({ data: { success: true, data: { id: 20, name: 'New Taluk', districtId: 10 } } })
const mockCreateHobli = vi.fn().mockResolvedValue({ data: { success: true, data: { id: 30, name: 'New Hobli', talukId: 20 } } })

vi.mock('@/features/geo/geoApi', () => ({
  geoApi: {
    reducerPath: 'geoApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
  useGetStatesQuery: vi.fn(),
  useCreateStateMutation: () => [mockCreateState, { isLoading: false }],
  useGetCitiesQuery: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  useCreateCityMutation: () => [mockCreateCity, { isLoading: false }],
  useGetDistrictsByStateQuery: vi.fn(),
  useCreateDistrictMutation: () => [mockCreateDistrict, { isLoading: false }],
  useGetTaluksQuery: vi.fn(),
  useCreateTalukMutation: () => [mockCreateTaluk, { isLoading: false }],
  useGetHoblisQuery: vi.fn(),
  useCreateHobliMutation: () => [mockCreateHobli, { isLoading: false }],
}))

import {
  useGetStatesQuery,
  useGetDistrictsByStateQuery,
  useGetTaluksQuery,
  useGetHoblisQuery,
} from '@/features/geo/geoApi'

describe('GeoManagementPage', () => {
  beforeEach(() => {
    vi.mocked(useGetStatesQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockStates },
      isLoading: false,
    } as ReturnType<typeof useGetStatesQuery>)
    vi.mocked(useGetDistrictsByStateQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockDistricts },
      isLoading: false,
    } as ReturnType<typeof useGetDistrictsByStateQuery>)
    vi.mocked(useGetTaluksQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockTaluks },
      isLoading: false,
    } as ReturnType<typeof useGetTaluksQuery>)
    vi.mocked(useGetHoblisQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: mockHoblis },
      isLoading: false,
    } as ReturnType<typeof useGetHoblisQuery>)
    mockCreateState.mockClear()
    mockCreateDistrict.mockClear()
  })

  it('should render the 4-column hierarchy layout', async () => {
    renderWithProviders(<GeoManagementPage />)
    await waitFor(() => {
      expect(screen.getAllByText('States').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Districts').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Taluks').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Hoblis').length).toBeGreaterThan(0)
    })
  })

  it('should display existing states in column 1', async () => {
    renderWithProviders(<GeoManagementPage />)
    await waitFor(() => {
      expect(screen.getByText('Karnataka')).toBeInTheDocument()
      expect(screen.getByText('Tamil Nadu')).toBeInTheDocument()
    })
  })

  it('should show "Select a parent first" when no state selected for District column', async () => {
    vi.mocked(useGetDistrictsByStateQuery).mockReturnValue({
      data: { success: true, message: 'OK', data: [] },
      isLoading: false,
    } as ReturnType<typeof useGetDistrictsByStateQuery>)
    renderWithProviders(<GeoManagementPage />)
    await waitFor(() => {
      expect(screen.getAllByText(/Select a parent first/i).length).toBeGreaterThan(0)
    })
  })

  it('should activate District column after selecting a state', async () => {
    renderWithProviders(<GeoManagementPage />)
    const user = userEvent.setup()
    const karnatakaBtn = await screen.findByText('Karnataka')
    await user.click(karnatakaBtn)
    await waitFor(() => {
      expect(screen.getByText('Bengaluru Urban')).toBeInTheDocument()
    })
  })

  it('should show loading skeleton when states are loading', () => {
    vi.mocked(useGetStatesQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useGetStatesQuery>)
    renderWithProviders(<GeoManagementPage />)
    // Loader2 spinner should appear instead of content
    expect(screen.queryByText('Karnataka')).not.toBeInTheDocument()
  })

  it('should open Add State sheet when Add State button clicked', async () => {
    renderWithProviders(<GeoManagementPage />)
    const user = userEvent.setup()
    const addStateBtn = await screen.findByRole('button', { name: /add state/i })
    await user.click(addStateBtn)
    // The Create form sheet should open with the state name input
    const stateNameInput = await screen.findByPlaceholderText(/enter state/i)
    expect(stateNameInput).toBeInTheDocument()
    expect(stateNameInput).toHaveValue('')
  })
})
