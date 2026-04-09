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

    // ─── Profile Workflow Actions ─────────────────────────────────────────────

    approveProfile: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { stagingId: number; body: ApproveProfileRequest }
    >({
      query: ({ stagingId, body }) => ({
        url: `/dc/profiles/${stagingId}/approve`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { stagingId }) => [
        { type: 'DcProfileStaging', id: stagingId },
        'DcTempleSearch',
        'DcDashboard',
      ],
    }),

    rejectProfile: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { stagingId: number; body: RejectProfileRequest }
    >({
      query: ({ stagingId, body }) => ({
        url: `/dc/profiles/${stagingId}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { stagingId }) => [
        { type: 'DcProfileStaging', id: stagingId },
        'DcDashboard',
      ],
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
  useApproveProfileMutation,
  useRejectProfileMutation,
  useGetDcNotificationsQuery,
  useGetDcUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useExportTemplesMutation,
  useExportDeclarationsMutation,
} = dcApi
