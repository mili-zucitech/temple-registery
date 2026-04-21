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
  WorkflowApproveRequest,
  WorkflowRejectRequest,
  DcClarifyRequest,
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

    // ─── Declaration Detail ───────────────────────────────────────────────────

    getDcDeclarationDetail: builder.query<ApiResponse<DeclarationDetailResponse>, number>({
      query: (id) => `/dc/declarations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'DcDeclaration', id }],
    }),

    // ─── Declaration Workflow Actions ─────────────────────────────────────────

    approveDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; body: WorkflowApproveRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/dc/declarations/${id}/approve`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DcDeclaration', id },
        'DcTempleSearch',
        'DcDashboard',
        { type: 'DcTempleProfile', id },
      ],
    }),

    rejectDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; body: WorkflowRejectRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/dc/declarations/${id}/reject`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DcDeclaration', id },
        'DcTempleSearch',
        'DcDashboard',
      ],
    }),

    clarifyDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; body: DcClarifyRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/dc/declarations/${id}/clarify`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DcDeclaration', id },
        'DcTempleSearch',
      ],
    }),

    flagPhysicalVerification: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; body: DcClarifyRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/dc/declarations/${id}/flag-physical`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'DcDeclaration', id },
        'DcTempleSearch',
      ],
    }),
    
    markUnderReviewDeclaration: builder.mutation<ApiResponse<WorkflowActionResponse>, number>({
      query: (id) => ({
        url: `/dc/declarations/${id}/under-review`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'DcDeclaration', id },
        'DcDashboard',
        'DcTempleSearch',
      ],
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
        url: `/dc/compliance/temples/${id}/verify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DcTempleProfile', id }, 'DcTempleSearch'],
    }),

    flagTemple: builder.mutation<ApiResponse<void>, { id: number; body: DcFlagRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/temples/${id}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'DcTempleProfile', id }, 'DcTempleSearch'],
    }),

    verifyTrust: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcVerifyRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/trusts/${id}/verify`,
        method: 'POST',
        body,
      }),
      // Invalidates the profile that contains this trust
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    flagTrust: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcFlagRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/trusts/${id}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    verifyEmployee: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcVerifyRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/employees/${id}/verify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    flagEmployee: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcFlagRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/employees/${id}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    /** Verify the entire Staff module for a temple — ONE call, no loops. */
    verifyStaffModule: builder.mutation<ApiResponse<void>, { templeId: number; body: DcVerifyRequest }>({
      query: ({ templeId, body }) => ({
        url: `/dc/compliance/staff/${templeId}/verify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    /** Flag the entire Staff module for a temple — ONE call. */
    flagStaffModule: builder.mutation<ApiResponse<void>, { templeId: number; body: DcFlagRequest }>({
      query: ({ templeId, body }) => ({
        url: `/dc/compliance/staff/${templeId}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    verifyContractor: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcVerifyRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/contractors/${id}/verify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    flagContractor: builder.mutation<ApiResponse<void>, { id: number; templeId: number; body: DcFlagRequest }>({
      query: ({ id, body }) => ({
        url: `/dc/compliance/contractors/${id}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    /** Verify the entire Contractors module for a temple — ONE call, no loops. */
    verifyContractorsModule: builder.mutation<ApiResponse<void>, { templeId: number; body: DcVerifyRequest }>({
      query: ({ templeId, body }) => ({
        url: `/dc/compliance/contractors-module/${templeId}/verify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),

    /** Flag the entire Contractors module for a temple — ONE call. */
    flagContractorsModule: builder.mutation<ApiResponse<void>, { templeId: number; body: DcFlagRequest }>({
      query: ({ templeId, body }) => ({
        url: `/dc/compliance/contractors-module/${templeId}/flag`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'DcTempleProfile', id: templeId }],
    }),


    // ─── Notifications ────────────────────────────────────────────────────────

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

    getDcUnreadCount: builder.query<ApiResponse<number>, void>({
      query: () => '/dc/notifications/unread-count',
      providesTags: ['DcNotification'],
    }),

    markNotificationRead: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({
        url: `/dc/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DcNotification'],
    }),

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
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  useMarkUnderReviewDeclarationMutation,
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
  useVerifyTrustMutation,
  useFlagTrustMutation,
  useVerifyEmployeeMutation,
  useFlagEmployeeMutation,
  useVerifyStaffModuleMutation,
  useFlagStaffModuleMutation,
  useVerifyContractorMutation,
  useFlagContractorMutation,
  useVerifyContractorsModuleMutation,
  useFlagContractorsModuleMutation,
} = dcApi
