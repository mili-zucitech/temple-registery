import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { TATempleProfilePage } from './TATempleProfilePage'

// ─── Module-level mocks ───────────────────────────────────────────────────────

vi.mock('@/features/temple/taProfileHooks', () => ({
  useTempleProfile: vi.fn(),
  useProfileHistory: vi.fn(),
}))

vi.mock('./ProfileOverviewPanel', () => ({
  ProfileOverviewPanel: () => <div data-testid="profile-overview-panel">Overview</div>,
}))

import { useTempleProfile, useProfileHistory } from '@/features/temple/taProfileHooks'
import type { TempleProfileStagingResponse, TaCurrentProfileResponse } from '@/features/temple/templeTypes'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { taProfileStagingSchema, type TaProfileStagingRequest } from '@/features/temple/templeTypes'

const mockUseTempleProfile = vi.mocked(useTempleProfile)
const mockUseProfileHistory = vi.mocked(useProfileHistory)

// ─── Factories ────────────────────────────────────────────────────────────────

function makeForm() {
  // Minimal form stub — hooks tests use renderHook; page tests just need non-null
  return {
    control: {} as ReturnType<typeof useForm<TaProfileStagingRequest>>['control'],
    handleSubmit: (cb: (v: TaProfileStagingRequest) => void) => () => cb({} as TaProfileStagingRequest),
    formState: { isDirty: false, errors: {} },
    getValues: () => ({}) as TaProfileStagingRequest,
    reset: vi.fn(),
    register: vi.fn(),
  } as unknown as ReturnType<typeof useForm<TaProfileStagingRequest>>
}

function makeProfile(overrides: Partial<TempleProfileStagingResponse> = {}): TempleProfileStagingResponse {
  return {
    id: 1, templeId: 42, versionNumber: 1, statusLabel: 'DRAFT',
    contactPersonName: 'Shri Ramesh', contactPersonDesignation: 'Executive Officer',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeCurrentProfile(overrides: Partial<TaCurrentProfileResponse> = {}): TaCurrentProfileResponse {
  return {
    id: 10, templeId: 42,
    contactPersonName: 'Shri Kumar', contactPersonDesignation: 'Trustee',
    publishedAt: '2025-06-01T00:00:00Z', updatedAt: '2025-06-01T00:00:00Z',
    ...overrides,
  }
}

const BASE_TEMPLE = {
  id: 42, name: 'Sri Chamundeshwari Temple', grade: 'A' as const,
  tradition: 'SHAKTA' as const, districtId: 1, trustRegistered: true,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
}

// ─── Default mock reset helper ────────────────────────────────────────────────

function setDefaults() {
  mockUseTempleProfile.mockReturnValue({
    profileStatus: 'DRAFT',
    temple: BASE_TEMPLE,
    currentProfile: null,
    stagingProfile: makeProfile(),
    talukName: undefined,
    hobliName: undefined,
    isLoading: false,
    isError: false,
    isIniting: false,
    isSaving: false,
    isSubmitting: false,
    isDeleting: false,
    isEditable: true,
    form: makeForm(),
    handleSave: vi.fn(),
    handleSubmit: vi.fn(),
    handleDeleteDraft: vi.fn(),
    handleStartEdit: vi.fn(),
  })

  mockUseProfileHistory.mockReturnValue({
    data: undefined,
    isLoading: false,
    isUninitialized: true,
  } as unknown as ReturnType<typeof useProfileHistory>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TATempleProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setDefaults()
  })

  it('should_renderLoadingSkeleton_when_isLoadingIsTrue', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      isLoading: true,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    // Skeleton cards appear; temple name not yet rendered
    expect(screen.queryByText('Sri Chamundeshwari Temple')).not.toBeInTheDocument()
  })

  it('should_renderErrorState_when_isErrorIsTrue', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      isLoading: false,
      isError: true,
      temple: null,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText(/Failed to load profile/i)).toBeInTheDocument()
  })

  it('should_renderEmptyState_when_templeIsNull', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      isLoading: false,
      isError: false,
      temple: null,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText(/Temple not assigned/i)).toBeInTheDocument()
  })

  it('should_renderTempleName_when_dataIsLoaded', () => {
    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText('Sri Chamundeshwari Temple')).toBeInTheDocument()
  })

  it('should_renderDraftStatusBanner_when_profileStatusIsDraft', () => {
    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText(/Draft in progress/i)).toBeInTheDocument()
  })

  it('should_renderApprovedStatusBanner_when_profileStatusIsApproved', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      profileStatus: 'APPROVED',
      stagingProfile: null,
      currentProfile: makeCurrentProfile(),
      isEditable: false,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText(/Profile approved/i)).toBeInTheDocument()
  })

  it('should_renderRejectedBanner_with_reviewComment_when_profileStatusIsRejected', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      profileStatus: 'REJECTED',
      stagingProfile: makeProfile({ statusLabel: 'REJECTED', reviewComment: 'Missing GPS coordinates.' }),
      isEditable: true,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByText(/Profile rejected/i)).toBeInTheDocument()
    expect(screen.getByText(/Missing GPS coordinates/i)).toBeInTheDocument()
  })

  it('should_showTabsForProfileHistoryAndCompare_when_dataIsLoaded', () => {
    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Edit Profile/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /History/i })).toBeInTheDocument()
  })

  it('should_showCompareTab_when_both_currentAndStagingProfileExist', () => {
    mockUseTempleProfile.mockReturnValue({
      ...mockUseTempleProfile(),
      profileStatus: 'DRAFT',
      stagingProfile: makeProfile({ statusLabel: 'DRAFT' }),
      currentProfile: makeCurrentProfile(),
      isEditable: true,
    } as ReturnType<typeof useTempleProfile>)

    renderWithProviders(<TATempleProfilePage />, { initialRoute: '/ta/temple' })

    expect(screen.getByRole('tab', { name: /Compare/i })).toBeInTheDocument()
  })
})
