import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type NotificationCategory = 'SUBMISSION' | 'APPROVAL' | 'REJECTION' | 'CLARIFICATION' | 'SITE_VISIT' | 'REMINDER' | 'OVERDUE' | 'DOCUMENT' | 'SYSTEM'
export type ModuleType = 'TEMPLE' | 'TRUST' | 'EMPLOYEE' | 'CONTRACTOR' | 'DECLARATION' | 'DOCUMENT' | 'SYSTEM'

export interface NotificationResponse {
  id: number
  title: string
  body: string
  priority?: NotificationPriority
  category?: NotificationCategory
  actionUrl?: string
  referenceType?: string
  referenceId?: number
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
    
    markRead: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    
    markAllRead: builder.mutation<ApiResponse<void>, void>({
      query: () => ({ url: '/notifications/read-all', method: 'POST' }),
      invalidatesTags: ['Notification'],
    }),
    
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
  useMarkReadMutation,
  useMarkAllReadMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = notificationApi
