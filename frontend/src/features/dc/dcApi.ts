import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  DcContextResponse,
  DcDashboardResponse,
  DcTempleSearchFilterRequest,
  DcTempleSearchItemResponse,
  TempleFullProfileResponse,
  DeclarationDetailResponse,
  ProfileStagingResponse,
  WorkflowActionResponse,
  ApproveProfileRequest,
  RejectProfileRequest,
  NotificationResponse,
  ExportJobResponse,
  ExportTemplesRequest,
  ExportDeclarationsRequest,
  DcFlagRequest,
  DcVerifyRequest,
} from './dcTypes'

export const dcApi = createApi({
  reducerPath: 'dcApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'DcContext',
    'DcDashboard',
    'DcTempleSearch',
    'DcTempleProfile',
    'DcDeclaration',
    'DcProfileStaging',
    'DcNotification',
    'DcExport',
  ],
  endpoints: (builder) => ({
    // ─── Context ──────────────────────────────────────────────────────────────

    getDcContext: builder.query<ApiResponse<DcContextResponse>, void>({
      query: () => '/dc/me',
      providesTags: ['DcContext'],
    }),

    // ─── Dashboard ────────────────────────────────────────────────────────────

    getDcDashboard: builder.query<ApiResponse<DcDashboardResponse>, void>({
      query: () => '/dc/dashboard',
      providesTags: ['DcDashboard'],
    }),

    // ─── Temple Search ────────────────────────────────────────────────────────

    searchDcTemples: builder.query<
      ApiResponse<PaginatedResponse<DcTempleSearchItemResponse>>,
      DcTempleSearchFilterRequest
    >({
      query: (params) => ({
        url: '/dc/temples',
        params,
      }),
      providesTags: ['DcTempleSearch'],
    }),

    // ─── Temple Profile ───────────────────────────────────────────────────────

    getDcTempleProfile: builder.query<ApiResponse<TempleFullProfileResponse>, number>({
      query: (id) => `/dc/temples/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'DcTempleProfile', id }],
    }),

    getDcPendingProfileStaging: builder.query<ApiResponse<ProfileStagingResponse>, number>({
      query: (templeId) => `/dc/temples/${templeId}/profile/pending`,
      providesTags: (_r, _e, templeId) => [{ type: 'DcProfileStaging', id: templeId }],
    }),

    // ─── Declaration Detail (read-only) ───────────────────────────────────────
    // Workflow actions (approve, reject, clarify, flag-physical, under-review, send-back)
    // are in governanceApi — use useApproveDeclarationMutation etc. from there.

    getDcDeclarationDetail: builder.query<ApiResponse<DeclarationDetailResponse>, number>({
      query: (id) => `/dc/declarations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'DcDeclaration', id }],
    }),

    // ─── Profile Workflow Actions ─────────────────────────────────────────────

    approveProfile: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { stagingId: number; templeId: number; body: ApproveProfileRequest }
    >({
      query: ({ stagingId, body }) => ({
        url: `/dc/profiles/${stagingId}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'DcProfileStaging', id: templeId },
        { type: 'DcTempleProfile', id: templeId },
        'DcTempleSearch',
        'DcDashboard',
      ],
    }),

    rejectProfile: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { stagingId: number; templeId: number; body: RejectProfileRequest }
    >({
      query: ({ stagingId, body }) => ({
        url: `/dc/profiles/${stagingId}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'DcProfileStaging', id: templeId },
        { type: 'DcTempleProfile', id: templeId },
        'DcDashboard',
      ],
    }),

    // ─── Compliance/Verification Actions ──────────────────────────────────────

    verifyTemple: builder.mutation<ApiResponse<void>, { id: number; body: DcVerifyRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/temples/${id}/verify`,
        method: 'POST',
        body: { remarks: body.notes },
      }),
      onQueryStarted: async ({ id: templeId }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          dcApi.util.updateQueryData('getDcTempleProfile', templeId, (draft) => {
            if (draft?.data?.temple) {
              draft.data.temple.verificationStatus = 'VERIFIED'
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DcTempleProfile', id }, 'DcTempleSearch'],
    }),

    flagTemple: builder.mutation<ApiResponse<void>, { id: number; body: DcFlagRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/temples/${id}/flag`,
        method: 'POST',
        body,
      }),
      onQueryStarted: async ({ id: templeId }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          dcApi.util.updateQueryData('getDcTempleProfile', templeId, (draft) => {
            if (draft?.data?.temple) {
              draft.data.temple.verificationStatus = 'FLAGGED'
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DcTempleProfile', id }, 'DcTempleSearch'],
    }),

    unflagTemple: builder.mutation<ApiResponse<void>, { id: number; remarks?: string }>({
      query: ({ id, remarks }) => ({
        url: `/dc/temples/${id}/unflag`,
        method: 'POST',
        body: { remarks },
      }),
      onQueryStarted: async ({ id: templeId }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          dcApi.util.updateQueryData('getDcTempleProfile', templeId, (draft) => {
            if (draft?.data?.temple) {
              draft.data.temple.verificationStatus = 'UNVERIFIED'
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patchResult.undo()
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DcTempleProfile', id }, 'DcTempleSearch'],
    }),

    // ─── Notifications (deprecated — use notificationApi instead) ────────────
    //
    // These endpoints duplicate the canonical /notifications/* routes.
    // Frontend hooks (useDcNotifications) have been redirected to notificationApi.
    // These remain exported for backward compatibility with the backend
    // DcNotificationController but should not be used in new code.

    /** @deprecated Use useListNotificationsQuery from notificationApi */
    getDcNotifications: builder.query<
      ApiResponse<PaginatedResponse<NotificationResponse>>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 10 } = {}) => ({
        url: '/dc/notifications',
        params: { page, size },
      }),
      providesTags: ['DcNotification'],
    }),

    /** @deprecated Use useGetUnreadCountQuery from notificationApi */
    getDcUnreadCount: builder.query<ApiResponse<number>, void>({
      query: () => '/dc/notifications/unread-count',
      providesTags: ['DcNotification'],
    }),

    /** @deprecated Use useMarkReadMutation from notificationApi */
    markNotificationRead: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/dc/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DcNotification'],
    }),

    /** @deprecated Use useMarkAllReadMutation from notificationApi */
    markAllNotificationsRead: builder.mutation<ApiResponse<number>, void>({
      query: () => ({
        url: '/dc/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['DcNotification'],
    }),

    // ─── Export ───────────────────────────────────────────────────────────────

    exportTemples: builder.mutation<
      ApiResponse<ExportJobResponse>,
      { body: ExportTemplesRequest; idempotencyKey?: string }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: '/dc/export/temples',
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: ['DcExport'],
    }),

    exportDeclarations: builder.mutation<
      ApiResponse<ExportJobResponse>,
      { body: ExportDeclarationsRequest; idempotencyKey?: string }
    >({
      query: ({ body, idempotencyKey }) => ({
        url: '/dc/export/declarations',
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: ['DcExport'],
    }),
  }),
})

export const {
  useGetDcContextQuery,
  useGetDcDashboardQuery,
  useSearchDcTemplesQuery,
  useGetDcTempleProfileQuery,
  useGetDcPendingProfileStagingQuery,
  useGetDcDeclarationDetailQuery,
  useApproveProfileMutation,
  useRejectProfileMutation,
  useGetDcNotificationsQuery,
  useGetDcUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useExportTemplesMutation,
  useExportDeclarationsMutation,
  useVerifyTempleMutation,
  useFlagTempleMutation,
  useUnflagTempleMutation,
} = dcApi
