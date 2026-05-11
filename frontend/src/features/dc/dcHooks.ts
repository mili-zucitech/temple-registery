import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/store'
import { dcApi } from './dcApi'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { API_BASE } from '@/constants/apiPaths'
import type { GeoSelection } from '@/features/geo/geoTypes'
import { USER_ROLES } from '@/constants/roles'
import {
  useGetDcDashboardQuery,
  useSearchDcTemplesQuery,
  useGetDcTempleProfileQuery,
  useGetDcPendingProfileStagingQuery,
  useGetDcProfileHistoryQuery,
  useGetDcDeclarationDetailQuery,
  useApproveProfileMutation,
  useRejectProfileMutation,
  useGetDcContextQuery,
} from './dcApi'
import {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '@/features/notification/notificationApi'
import {
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  useMarkUnderReviewDeclarationMutation,
} from '@/features/governance/governanceApi'
import { useScheduleSiteVisitMutation } from '@/features/declaration/declarationApi'
import type {
  DcTempleSearchFilterRequest,
  ApproveProfileRequest,
  RejectProfileRequest,
} from './dcTypes'
import type {
  WorkflowApproveRequest,
  WorkflowRejectRequest,
  DcClarifyRequest,
} from '@/features/governance/governanceTypes'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

function parseIntParam(value: string | null): number | undefined {
  const n = Number(value)
  return value !== null && !isNaN(n) ? n : undefined
}

// ─── useDcDashboard ───────────────────────────────────────────────────────────

/**
 * Returns DC dashboard KPI data.
 * Cache is considered fresh for 5 minutes (refetchOnMountOrArgChange: 300).
 * Skipped for AUDITOR and VIEWER roles — the endpoint is DC/SA only.
 */
export function useDcDashboard() {
  const role = useAppSelector((s) => s.auth.currentUser?.role)
  const isDcRole =
    role === USER_ROLES.SUPER_ADMIN ||
    role === USER_ROLES.DISTRICT_COLLECTOR ||
    role === USER_ROLES.DC_STAFF
  const { data, isLoading, isError, refetch } = useGetDcDashboardQuery(undefined, {
    // Treat cached data as fresh for 5 minutes before re-fetching on mount
    refetchOnMountOrArgChange: 300,
    skip: !isDcRole,
  })

  return {
    dashboard: data?.data ?? null,
    isLoading,
    isError,
    refetch,
  }
}

// ─── useDcTempleSearch ────────────────────────────────────────────────────────

/**
 * URL-synced paginated temple search.
 * Reads and writes filter state directly from/to the URL via useSearchParams.
 * For DC/DC_STAFF roles the district is locked server-side (JWT wins); we also
 * pre-populate and lock it client-side for a frictionless experience.
 */

export function useDcTempleSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((s) => s.auth.currentUser)

  // Statewide roles (SA, AUDITOR, VIEWER) search without district restriction
  const role = currentUser?.role
  const isStatewideRole = role === USER_ROLES.SUPER_ADMIN
    || role === USER_ROLES.AUDITOR
    || role === USER_ROLES.VIEWER

  // Fetch DC context only for DC roles — statewide roles don't need it
  const { data: contextData, refetch: refetchContext } = useGetDcContextQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !currentUser?.userId || isStatewideRole,
  })
  const dcContext = contextData?.data ?? null

  // Track previous userId to detect user switch
  const prevUserIdRef = useRef<number | undefined>(undefined)

  // Local state for districtId — ONLY used for DC/DC_STAFF (locked to JWT).
  // Statewide roles (SA, AUDITOR, VIEWER) read districtId directly from URL params instead.
  const [districtId, setDistrictId] = useState<number | null>(null)

  // For statewide roles, districtId comes from URL (user's optional geo selection).
  // For DC roles, districtId comes from state (locked to JWT, set below).
  const effectiveDistrictId: number | null = isStatewideRole
    ? (parseIntParam(searchParams.get('districtId')) ?? null)
    : districtId

  // On first load for a statewide role, strip any stale DC-scoped URL params
  // (districtId/cityId) that may be leftover from a previous DC user session.
  // Statewide roles always start with an unfiltered view; the user can narrow down manually.
  const hasCleanedRef = useRef(false)
  useEffect(() => {
    if (!currentUser?.userId || !isStatewideRole) return
    if (hasCleanedRef.current) return
    hasCleanedRef.current = true
    if (searchParams.has('districtId') || searchParams.has('cityId')) {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev)
        updated.delete('districtId')
        updated.delete('cityId')
        if (!updated.has('stateId')) updated.set('stateId', '1')
        updated.set('page', '0')
        return updated
      }, { replace: true })
    }
  // Intentionally minimal deps — this must run only once per user mount, not on every searchParams change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userId, isStatewideRole])

  // Ensure districtId is initialized from user as soon as available
  useEffect(() => {
    if (currentUser?.districtId) {
      setDistrictId(currentUser.districtId)
    }
  }, [currentUser?.districtId])

  // On userId change, reset RTK Query cache, refetch context, and reset URL params
  useEffect(() => {
    if (!currentUser?.userId) return
    const prevUserId = prevUserIdRef.current
    if (prevUserId !== undefined && prevUserId !== currentUser.userId) {
      dispatch(dcApi.util.resetApiState())
      refetchContext()
      setSearchParams(() => {
        const updated = new URLSearchParams()
        if (currentUser.districtId) updated.set('districtId', String(currentUser.districtId))
        updated.set('stateId', '1')
        updated.set('page', '0')
        updated.set('size', '10')
        return updated
      }, { replace: true })
      setDistrictId(currentUser.districtId ?? null)
    }
    prevUserIdRef.current = currentUser.userId
  }, [currentUser?.userId, currentUser?.districtId, dispatch, setSearchParams, refetchContext])

  // Pre-populate districtId + cityId for DC/DC_STAFF only when those params are absent
  useEffect(() => {
    if (!dcContext) return
    const isDcRole = dcContext.role === 'DISTRICT_COLLECTOR' || dcContext.role === 'DC_STAFF'
    if (!isDcRole) return
    if (!dcContext.districtId) return
    if (searchParams.has('districtId') && searchParams.has('stateId')) return
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev)
      if (!updated.has('districtId')) updated.set('districtId', String(dcContext.districtId))
      if (!updated.has('cityId') && dcContext.cityId) updated.set('cityId', String(dcContext.cityId))
      if (!updated.has('stateId')) updated.set('stateId', '1')
      updated.set('page', '0')
      return updated
    }, { replace: true })
    setDistrictId(dcContext.districtId)
  }, [dcContext, searchParams, setSearchParams])

  const page = Number(searchParams.get('page') ?? '0')
  const size = Number(searchParams.get('size') ?? '10')

  const filters: DcTempleSearchFilterRequest & { userId?: number } = useMemo(() => ({
    userId: currentUser?.userId,
    districtId: effectiveDistrictId ?? undefined,
    cityId: parseIntParam(searchParams.get('cityId')),
    talukId: parseIntParam(searchParams.get('talukId')),
    hobliId: parseIntParam(searchParams.get('hobliId')),
    keyword: searchParams.get('keyword') ?? undefined,
    deityName: searchParams.get('deityName') ?? undefined,
    tradition: searchParams.get('tradition') ?? undefined,
    declarationStatus: searchParams.get('declarationStatus') ?? undefined,
    hasApprovedDeclaration: searchParams.get('hasApprovedDeclaration') === 'true'
      ? true
      : searchParams.get('hasApprovedDeclaration') === 'false'
        ? false
        : undefined,
    pendingProfileReview: searchParams.get('pendingProfileReview') === 'true'
      ? true
      : searchParams.get('pendingProfileReview') === 'false'
        ? false
        : undefined,
    grade: searchParams.get('grade') ? searchParams.get('grade')!.split(',') : undefined,
    trustRegistered: searchParams.get('trustRegistered') === 'true'
      ? true
      : searchParams.get('trustRegistered') === 'false'
        ? false
        : undefined,
    establishedYearFrom: parseIntParam(searchParams.get('establishedYearFrom')),
    establishedYearTo: parseIntParam(searchParams.get('establishedYearTo')),
    sort: searchParams.get('sort') ?? undefined,
    page,
    size,
  }), [searchParams, currentUser?.userId, effectiveDistrictId, page, size])

  // Only fetch when userId is available; for DC roles also require districtId
  const shouldFetch = !!currentUser?.userId && (isStatewideRole || !!districtId)
  const { data, isLoading, isError, isFetching, refetch } = useSearchDcTemplesQuery(filters, {
    refetchOnMountOrArgChange: true,
    skip: !shouldFetch,
  })

  const geoSelection: GeoSelection = useMemo(() => ({
    stateId: parseIntParam(searchParams.get('stateId')) ?? 1,
    cityId: parseIntParam(searchParams.get('cityId')),
    districtId: effectiveDistrictId ?? undefined,
    talukId: parseIntParam(searchParams.get('talukId')),
    hobliId: parseIntParam(searchParams.get('hobliId')),
  }), [searchParams, effectiveDistrictId])

  const applyGeoSelection = useCallback(
    (geo: GeoSelection) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev)
        updated.set('page', '0')
        ;(['stateId', 'cityId', 'districtId', 'talukId', 'hobliId'] as (keyof GeoSelection)[]).forEach((key) => {
          const val = geo[key]
          if (val != null) updated.set(key, String(val))
          else updated.delete(key)
        })
        return updated
      })
    },
    [setSearchParams],
  )

  const applyFilters = useCallback(
    (next: Partial<DcTempleSearchFilterRequest>) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev)
        // Reset to page 0 when filters change
        updated.set('page', '0')
        Object.entries(next).forEach(([key, value]) => {
          if (value === undefined || value === null || value === '') {
            updated.delete(key)
          } else if (Array.isArray(value)) {
            if (value.length > 0) updated.set(key, value.join(','))
            else updated.delete(key)
          } else {
            updated.set(key, String(value))
          }
        })
        return updated
      })
    },
    [setSearchParams],
  )


  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const cleared = new URLSearchParams({ page: '0', size: String(size) })
      ;(['stateId', 'cityId', 'districtId'] as const).forEach((key) => {
        if (prev.has(key)) cleared.set(key, prev.get(key)!)
      })
      return cleared
    })
  }, [setSearchParams, size])

  const goToPage = useCallback(
    (p: number) => {
      setSearchParams((prev) => {
        const updated = new URLSearchParams(prev)
        updated.set('page', String(p))
        return updated
      })
    },
    [setSearchParams],
  )

  // Render guard: statewide roles are always ready; DC roles wait for districtId from JWT
  const ready = isStatewideRole ? !!currentUser?.userId : (!!currentUser?.userId && !!districtId)

  return {
    temples: data?.data?.content ?? [],
    total: data?.data?.totalElements ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    filters,
    geoSelection,
    page,
    size,
    isLoading,
    isError,
    isFetching,
    applyFilters,
    applyGeoSelection,
    clearFilters,
    goToPage,
    dcContext,
    currentUser,
    setSearchParams,
    searchParams,
    refetchContext,
    refetchSearch: refetch,
    ready,
  }
}

// ─── useDcTempleProfile ───────────────────────────────────────────────────────

/**
 * Loads the full aggregated temple profile for the DC module.
 * The pending profile staging is intentionally NOT fetched here — it returns 404
 * for every temple that has no pending review submission, which would:
 *   (a) slow down page load (isLoading waits for both)
 *   (b) fire the global RTK Query error middleware on every non-pending temple
 * Use useDcPendingProfileStaging(templeId) separately when staging data is needed.
 */
export function useDcTempleProfile(templeId: number) {
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
    refetch,
  } = useGetDcTempleProfileQuery(templeId, { skip: !templeId })

  return {
    profile: profileData?.data ?? null,
    isLoading: profileLoading,
    isError: profileError,
    profileLoading,
    refetch,
  }
}

/**
 * Lazily loads pending profile staging for a specific temple.
 * Call this ONLY when you actually need the staging data (e.g., the "Pending Review" section).
 * Returns `{ pendingStaging: null }` when the temple has no pending review submission.
 */
export function useDcPendingProfileStaging(templeId: number, skip = false) {
  const { data, isLoading, isError, refetch } = useGetDcPendingProfileStagingQuery(templeId, {
    skip: !templeId || skip,
  })

  return {
    pendingStaging: data?.data ?? null,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Loads enriched declaration detail with all sub-table line items and clarification history.
 */
export function useDcDeclarationDetail(declarationId: number) {
  const { data, isLoading, isError } = useGetDcDeclarationDetailQuery(declarationId, {
    skip: !declarationId,
  })

  return {
    declaration: data?.data ?? null,
    isLoading,
    isError,
  }
}

// ─── Confirmation Dialog State ─────────────────────────────────────────────

type ActionKind = 'approve' | 'reject' | 'clarify' | 'flag-physical' | 'schedule-site-visit' | null

interface WorkflowDialogState {
  open: boolean
  kind: ActionKind
  declarationId: number | null
  templeId: number | null
}

// ─── useWorkflowActions ───────────────────────────────────────────────────────

/**
 * Manages declaration workflow actions with confirmation dialogs.
 *
 * Usage:
 *  const {
 *    dialog, openDialog, closeDialog,
 *    confirmApprove, confirmReject, confirmClarify, confirmFlagPhysical,
 *    isSubmitting,
 *  } = useWorkflowActions()
 *
 * Confirmation is two-step: call `openDialog(kind, id, templeId)` to show the dialog,
 * then call the `confirm*` handler with the form payload.
 *
 * templeId is required so that after a workflow action the correct DcTempleProfile
 * cache entry is invalidated and the UI reflects the new status immediately.
 */
export function useWorkflowActions() {
  const dispatch = useAppDispatch()
  const [dialog, setDialog] = useState<WorkflowDialogState>({
    open: false,
    kind: null,
    declarationId: null,
    templeId: null,
  })

  const [approveDeclaration, { isLoading: approving }] = useApproveDeclarationMutation()
  const [rejectDeclaration, { isLoading: rejecting }] = useRejectDeclarationMutation()
  const [clarifyDeclaration, { isLoading: clarifying }] = useClarifyDeclarationMutation()
  const [flagPhysical, { isLoading: flagging }] = useFlagPhysicalVerificationMutation()
  const [markUnderReview] = useMarkUnderReviewDeclarationMutation()
  const [scheduleSiteVisit, { isLoading: scheduling }] = useScheduleSiteVisitMutation()

  const isSubmitting = approving || rejecting || clarifying || flagging || scheduling

  /** Invalidate DC-side caches so the temple profile and declaration detail refresh. */
  const invalidateDcCaches = useCallback((declarationId: number | null, templeId: number | null) => {
    if (declarationId) {
      dispatch(dcApi.util.invalidateTags([{ type: 'DcDeclaration', id: declarationId }]))
    }
    if (templeId) {
      dispatch(dcApi.util.invalidateTags([{ type: 'DcTempleProfile', id: templeId }, 'DcTempleSearch', 'DcDashboard']))
    }
  }, [dispatch])

  const openDialog = useCallback((kind: ActionKind, declarationId: number, templeId?: number) => {
    setDialog({ open: true, kind, declarationId, templeId: templeId ?? null })
  }, [])

  const closeDialog = useCallback(() => {
    setDialog({ open: false, kind: null, declarationId: null, templeId: null })
  }, [])

  const confirmApprove = useCallback(
    async (body: WorkflowApproveRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await approveDeclaration({
          id: dialog.declarationId,
          templeId: dialog.templeId ?? 0,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        if (result.data?.acknowledgementNumber) {
          const ackNo = result.data.acknowledgementNumber
          const declarationId = dialog.declarationId!
          toast.success(`Approved. Acknowledgement: ${ackNo}`, {
            duration: 10000,
            action: {
              label: 'Download Letter',
              onClick: () => window.open(`${API_BASE}/declarations/${declarationId}/acknowledgement/download`, '_blank', 'noopener,noreferrer'),
            },
          })
        } else {
          toast.success(result.message ?? 'Declaration approved.')
        }
        invalidateDcCaches(dialog.declarationId, dialog.templeId)
        closeDialog()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to approve declaration. Please try again.'))
      }
    },
    [dialog.declarationId, dialog.templeId, approveDeclaration, invalidateDcCaches, closeDialog],
  )

  const confirmReject = useCallback(
    async (body: WorkflowRejectRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await rejectDeclaration({
          id: dialog.declarationId,
          templeId: dialog.templeId ?? 0,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Declaration rejected.')
        invalidateDcCaches(dialog.declarationId, dialog.templeId)
        closeDialog()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to reject declaration. Please try again.'))
      }
    },
    [dialog.declarationId, dialog.templeId, rejectDeclaration, invalidateDcCaches, closeDialog],
  )

  const confirmClarify = useCallback(
    async (body: DcClarifyRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await clarifyDeclaration({
          id: dialog.declarationId,
          templeId: dialog.templeId ?? 0,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Clarification requested.')
        invalidateDcCaches(dialog.declarationId, dialog.templeId)
        closeDialog()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to request clarification. Please try again.'))
      }
    },
    [dialog.declarationId, dialog.templeId, clarifyDeclaration, invalidateDcCaches, closeDialog],
  )

  const confirmFlagPhysical = useCallback(
    async (body: DcClarifyRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await flagPhysical({
          id: dialog.declarationId,
          templeId: dialog.templeId ?? 0,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Flagged for physical verification.')
        invalidateDcCaches(dialog.declarationId, dialog.templeId)
        closeDialog()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to flag for physical verification. Please try again.'))
      }
    },
    [dialog.declarationId, dialog.templeId, flagPhysical, invalidateDcCaches, closeDialog],
  )

  const confirmMarkUnderReview = useCallback(
    async (declarationId: number) => {
      try {
        await markUnderReview(declarationId).unwrap()
        // No toast needed for silent background transition
      } catch {
        console.error('Failed to mark declaration as under review')
      }
    },
    [markUnderReview]
  )

  const confirmScheduleSiteVisit = useCallback(
    async (body: WorkflowApproveRequest) => {
      if (!dialog.declarationId) return
      try {
        await scheduleSiteVisit({
          id: dialog.declarationId,
          body: { notes: body.remarks },
        }).unwrap()
        toast.success('Site visit scheduled.')
        invalidateDcCaches(dialog.declarationId, dialog.templeId)
        closeDialog()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to schedule site visit. Please try again.'))
      }
    },
    [dialog.declarationId, dialog.templeId, scheduleSiteVisit, invalidateDcCaches, closeDialog],
  )

  return {
    dialog,
    openDialog,
    closeDialog,
    confirmApprove,
    confirmReject,
    confirmClarify,
    confirmFlagPhysical,
    confirmScheduleSiteVisit,
    confirmMarkUnderReview,
    isSubmitting,
  }
}

// ─── useProfileWorkflowActions ────────────────────────────────────────────────

/**
 * Manages temple profile staging approval and rejection.
 */
export function useProfileWorkflowActions() {
  const [approveProfile, { isLoading: approving }] = useApproveProfileMutation()
  const [rejectProfile, { isLoading: rejecting }] = useRejectProfileMutation()

  const isSubmitting = approving || rejecting

  const submitApproveProfile = useCallback(
    async (stagingId: number, templeId: number, body: ApproveProfileRequest) => {
      try {
        const result = await approveProfile({ stagingId, templeId, body }).unwrap()
        toast.success(result.message ?? 'Profile approved.')
        return true
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to approve profile. Please try again.'))
        return false
      }
    },
    [approveProfile],
  )

  const submitRejectProfile = useCallback(
    async (stagingId: number, templeId: number, body: RejectProfileRequest) => {
      try {
        const result = await rejectProfile({ stagingId, templeId, body }).unwrap()
        toast.success(result.message ?? 'Profile rejected.')
        return true
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Failed to reject profile. Please try again.'))
        return false
      }
    },
    [rejectProfile],
  )

  return {
    submitApproveProfile,
    submitRejectProfile,
    isSubmitting,
  }
}

// ─── useNotifications ─────────────────────────────────────────────────────────

/**
 * Fetches the temple profile version history for DC review.
 */
export function useDcProfileHistory(templeId: number, page = 0, size = 10) {
  const { data, isLoading, isError } = useGetDcProfileHistoryQuery(
    { templeId, page, size },
    { skip: !templeId },
  )
  return {
    history: data?.data?.content ?? [],
    total: data?.data?.totalElements ?? 0,
    isLoading,
    isError,
  }
}

// ─── useNotifications ─────────────────────────────────────────────────────────

/**
 * DC notification inbox with 60-second polling.
 * Exposes mark-read and mark-all-read actions.
 */
export function useDcNotifications(page = 0, size = 10) {
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = useListNotificationsQuery(
    { page, size },
    { pollingInterval: 60_000 },
  )

  const {
    data: countData,
  } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  })

  const [markRead] = useMarkReadMutation()
  const [markAllRead] = useMarkAllReadMutation()

  const onMarkRead = useCallback(
    async (id: number) => {
      try {
        await markRead(id).unwrap()
      } catch (err) {
        toast.error(extractApiErrorMessage(err, 'Could not mark notification as read.'))
      }
    },
    [markRead],
  )

  const onMarkAllRead = useCallback(async () => {
    try {
      const result = await markAllRead().unwrap()
      toast.success(`${result.data ?? 0} notification(s) marked as read.`)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Could not mark notifications as read.'))
    }
  }, [markAllRead])

  return {
    notifications: listData?.data?.content ?? [],
    total: listData?.data?.totalElements ?? 0,
    totalPages: listData?.data?.totalPages ?? 0,
    unreadCount: countData?.data ?? 0,
    isLoading: listLoading,
    isError: listError,
    onMarkRead,
    onMarkAllRead,
  }
}
