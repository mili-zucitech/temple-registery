import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useGetDcDashboardQuery,
  useSearchDcTemplesQuery,
  useGetDcTempleProfileQuery,
  useGetDcPendingProfileStagingQuery,
  useGetDcDeclarationDetailQuery,
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  useApproveProfileMutation,
  useRejectProfileMutation,
  useGetDcNotificationsQuery,
  useGetDcUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './dcApi'
import type {
  DcTempleSearchFilterRequest,
  WorkflowApproveRequest,
  WorkflowRejectRequest,
  DcClarifyRequest,
  ApproveProfileRequest,
  RejectProfileRequest,
} from './dcTypes'

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
 */
export function useDcDashboard() {
  const { data, isLoading, isError, refetch } = useGetDcDashboardQuery(undefined, {
    // Treat cached data as fresh for 5 minutes before re-fetching on mount
    refetchOnMountOrArgChange: 300,
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
 * District override is enforced server-side; clients need not set districtId for DC roles.
 */
export function useDcTempleSearch() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '0')
  const size = Number(searchParams.get('size') ?? '10')

  const filters: DcTempleSearchFilterRequest = useMemo(() => ({
    districtId: parseIntParam(searchParams.get('districtId')),
    talukId: parseIntParam(searchParams.get('talukId')),
    hobliId: parseIntParam(searchParams.get('hobliId')),
    keyword: searchParams.get('keyword') ?? undefined,
    deityName: searchParams.get('deityName') ?? undefined,
    tradition: searchParams.get('tradition') ?? undefined,
    declarationStatus: searchParams.get('declarationStatus') ?? undefined,
    grade: searchParams.get('grade') ? searchParams.get('grade')!.split(',') : undefined,
    trustRegistered: searchParams.get('trustRegistered') === 'true'
      ? true
      : searchParams.get('trustRegistered') === 'false'
        ? false
        : undefined,
    sort: searchParams.get('sort') ?? undefined,
    page,
    size,
  }), [searchParams])

  const { data, isLoading, isError, isFetching } = useSearchDcTemplesQuery(filters)

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
    setSearchParams(new URLSearchParams({ page: '0', size: String(size) }))
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

  return {
    temples: data?.data?.content ?? [],
    total: data?.data?.totalElements ?? 0,
    totalPages: data?.data?.totalPages ?? 0,
    filters,
    page,
    size,
    isLoading,
    isError,
    isFetching,
    applyFilters,
    clearFilters,
    goToPage,
  }
}

// ─── useDcTempleProfile ───────────────────────────────────────────────────────

/**
 * Loads the full aggregated temple profile and its pending profile staging (if any).
 */
export function useDcTempleProfile(templeId: number) {
  const {
    data: profileData,
    isLoading: profileLoading,
    isError: profileError,
  } = useGetDcTempleProfileQuery(templeId, { skip: !templeId })

  const {
    data: stagingData,
    isLoading: stagingLoading,
    isError: stagingError,
  } = useGetDcPendingProfileStagingQuery(templeId, { skip: !templeId })

  return {
    profile: profileData?.data ?? null,
    pendingStaging: stagingData?.data ?? null,
    isLoading: profileLoading || stagingLoading,
    isError: profileError || stagingError,
    profileLoading,
    stagingLoading,
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

type ActionKind = 'approve' | 'reject' | 'clarify' | 'flag-physical' | null

interface WorkflowDialogState {
  open: boolean
  kind: ActionKind
  declarationId: number | null
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
 * Confirmation is two-step: call `openDialog(kind, id)` to show the dialog,
 * then call the `confirm*` handler with the form payload.
 */
export function useWorkflowActions() {
  const [dialog, setDialog] = useState<WorkflowDialogState>({
    open: false,
    kind: null,
    declarationId: null,
  })

  const [approveDeclaration, { isLoading: approving }] = useApproveDeclarationMutation()
  const [rejectDeclaration, { isLoading: rejecting }] = useRejectDeclarationMutation()
  const [clarifyDeclaration, { isLoading: clarifying }] = useClarifyDeclarationMutation()
  const [flagPhysical, { isLoading: flagging }] = useFlagPhysicalVerificationMutation()

  const isSubmitting = approving || rejecting || clarifying || flagging

  const openDialog = useCallback((kind: ActionKind, declarationId: number) => {
    setDialog({ open: true, kind, declarationId })
  }, [])

  const closeDialog = useCallback(() => {
    setDialog({ open: false, kind: null, declarationId: null })
  }, [])

  const confirmApprove = useCallback(
    async (body: WorkflowApproveRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await approveDeclaration({
          id: dialog.declarationId,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.data?.acknowledgementNumber
          ? `Approved. Acknowledgement: ${result.data.acknowledgementNumber}`
          : result.message ?? 'Declaration approved.')
        closeDialog()
      } catch {
        toast.error('Failed to approve declaration. Please try again.')
      }
    },
    [dialog.declarationId, approveDeclaration, closeDialog],
  )

  const confirmReject = useCallback(
    async (body: WorkflowRejectRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await rejectDeclaration({
          id: dialog.declarationId,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Declaration rejected.')
        closeDialog()
      } catch {
        toast.error('Failed to reject declaration. Please try again.')
      }
    },
    [dialog.declarationId, rejectDeclaration, closeDialog],
  )

  const confirmClarify = useCallback(
    async (body: DcClarifyRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await clarifyDeclaration({
          id: dialog.declarationId,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Clarification requested.')
        closeDialog()
      } catch {
        toast.error('Failed to request clarification. Please try again.')
      }
    },
    [dialog.declarationId, clarifyDeclaration, closeDialog],
  )

  const confirmFlagPhysical = useCallback(
    async (body: DcClarifyRequest) => {
      if (!dialog.declarationId) return
      try {
        const result = await flagPhysical({
          id: dialog.declarationId,
          body,
          idempotencyKey: newIdempotencyKey(),
        }).unwrap()
        toast.success(result.message ?? 'Flagged for physical verification.')
        closeDialog()
      } catch {
        toast.error('Failed to flag for physical verification. Please try again.')
      }
    },
    [dialog.declarationId, flagPhysical, closeDialog],
  )

  return {
    dialog,
    openDialog,
    closeDialog,
    confirmApprove,
    confirmReject,
    confirmClarify,
    confirmFlagPhysical,
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
    async (stagingId: number, body: ApproveProfileRequest) => {
      try {
        const result = await approveProfile({ stagingId, body }).unwrap()
        toast.success(result.message ?? 'Profile approved.')
        return true
      } catch {
        toast.error('Failed to approve profile. Please try again.')
        return false
      }
    },
    [approveProfile],
  )

  const submitRejectProfile = useCallback(
    async (stagingId: number, body: RejectProfileRequest) => {
      try {
        const result = await rejectProfile({ stagingId, body }).unwrap()
        toast.success(result.message ?? 'Profile rejected.')
        return true
      } catch {
        toast.error('Failed to reject profile. Please try again.')
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
 * DC notification inbox with 60-second polling.
 * Exposes mark-read and mark-all-read actions.
 */
export function useDcNotifications(page = 0, size = 10) {
  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = useGetDcNotificationsQuery(
    { page, size },
    { pollingInterval: 60_000 },
  )

  const {
    data: countData,
  } = useGetDcUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
  })

  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()

  const onMarkRead = useCallback(
    async (id: number) => {
      try {
        await markRead(id).unwrap()
      } catch {
        toast.error('Could not mark notification as read.')
      }
    },
    [markRead],
  )

  const onMarkAllRead = useCallback(async () => {
    try {
      const result = await markAllRead().unwrap()
      toast.success(`${result.data ?? 0} notification(s) marked as read.`)
    } catch {
      toast.error('Could not mark notifications as read.')
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
