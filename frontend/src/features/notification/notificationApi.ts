import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface NotificationResponse {
  id: number; title: string; body: string
  referenceType?: string; referenceId?: number
  read: boolean; readAt?: string; createdAt: string
}

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    listNotifications: builder.query<ApiResponse<PaginatedResponse<NotificationResponse>>, { page?: number; size?: number }>({
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
  }),
})

export const { useListNotificationsQuery, useMarkReadMutation, useMarkAllReadMutation } = notificationApi
