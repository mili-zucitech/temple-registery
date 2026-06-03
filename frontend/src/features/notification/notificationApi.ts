import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type NotificationCategory = 'SUBMISSION' | 'APPROVAL' | 'REJECTION' | 'CLARIFICATION' | 'SITE_VISIT' | 'REMINDER' | 'OVERDUE' | 'DOCUMENT' | 'SYSTEM'
export type ModuleType = 'TEMPLE' | 'TRUST' | 'EMPLOYEE' | 'CONTRACTOR' | 'DECLARATION' | 'DOCUMENT' | 'FINANCE' | 'SYSTEM'

export interface NotificationResponse {
  id: number
  /** Canonical event type, e.g. TEMPLE_PROFILE_APPROVED, TRUST_REJECTED. */
  notificationType?: string
  title: string
  body: string
  priority?: NotificationPriority
  category?: NotificationCategory
  actionUrl?: string
  /** Deep-link target — use this for navigation on click. Prefer over actionUrl. */
  redirectUrl?: string
  referenceType?: string
  referenceId?: number
  workflowInstanceId?: number
  /** Owning temple ID — used for DC deep-linking. */
  templeId?: number
  /** Denormalised temple name shown in the notification body. */
  templeName?: string
  /** Full name of the user who triggered the event. */
  actionByName?: string
  actionByRole?: string
  workflowStatus?: string
  read: boolean
  readAt?: string
  createdAt: string
}

export interface NotificationPreferenceResponse {
  id: number
  moduleType: ModuleType
  inAppEnabled: boolean
  emailEnabled: boolean
}

export interface UpdatePreferencesRequest {
  preferences: {
    moduleType: ModuleType
    inAppEnabled: boolean
    emailEnabled: boolean
  }[]
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification', 'NotificationPreference'],
  endpoints: (builder) => ({
    listNotifications: builder.query<
      ApiResponse<PaginatedResponse<NotificationResponse>>,
      { page?: number; size?: number }
    >({
      query: ({ page = 0, size = 10 } = {}) => ({ url: '/notifications', params: { page, size } }),
      providesTags: ['Notification'],
    }),

    getUnreadCount: builder.query<ApiResponse<number>, void>({
      query: () => '/notifications/unread-count',
      providesTags: ['Notification'],
    }),

    // ── Mark read ──────────────────────────────────────────────────────────

    markRead: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    markAllRead: builder.mutation<ApiResponse<void>, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),

    // ── Delete ─────────────────────────────────────────────────────────────

    deleteNotification: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),

    clearAllNotifications: builder.mutation<ApiResponse<number>, void>({
      query: () => ({ url: '/notifications/clear-all', method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),

    deleteBulkNotifications: builder.mutation<ApiResponse<number>, number[]>({
      query: (ids) => ({ url: '/notifications/bulk', method: 'DELETE', body: ids }),
      invalidatesTags: ['Notification'],
    }),

    // ── Preferences ────────────────────────────────────────────────────────

    getPreferences: builder.query<ApiResponse<NotificationPreferenceResponse[]>, void>({
      query: () => '/notification-preferences',
      providesTags: ['NotificationPreference'],
    }),

    updatePreferences: builder.mutation<ApiResponse<NotificationPreferenceResponse[]>, UpdatePreferencesRequest>({
      query: (body) => ({
        url: '/notification-preferences',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['NotificationPreference'],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useDeleteBulkNotificationsMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = notificationApi
