import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { UserRole } from '@/constants/roles'

export interface UserAdminResponse {
  id: number; username: string; email: string; fullName: string
  mobile?: string; role: UserRole; active: boolean; aadhaarVerified: boolean
  districtId?: number; templeId?: number; lastLoginAt?: string; createdAt: string
}

export interface CreateUserRequest {
  username: string; email: string; password: string; fullName: string
  mobile?: string; role: UserRole; districtId?: number; templeId?: number
}

export interface AuditEventResponse {
  id: number; actorUsername: string; action: string; entityType: string
  entityId: number; details?: string; ipAddress?: string; createdAt: string
}

export interface AuthEventResponse {
  id: number; username: string; eventType: string; status: string
  ipAddress?: string; userAgent?: string; occurredAt: string
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdminUser', 'AuditEvent', 'AuthEvent'],
  endpoints: (builder) => ({
    listUsers: builder.query<ApiResponse<PaginatedResponse<UserAdminResponse>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => ({ url: '/admin/users', params: { page, size } }),
      providesTags: ['AdminUser'],
    }),
    createUser: builder.mutation<ApiResponse<UserAdminResponse>, CreateUserRequest>({
      query: (body) => ({ url: '/admin/users', method: 'POST', body }),
      invalidatesTags: ['AdminUser'],
    }),
    updateUser: builder.mutation<ApiResponse<UserAdminResponse>, { id: number; body: Partial<CreateUserRequest> }>({
      query: ({ id, body }) => ({ url: `/admin/users/${id}`, method: 'PUT', body }),
      invalidatesTags: ['AdminUser'],
    }),
    deactivateUser: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/users/${id}/deactivate`, method: 'POST' }),
      invalidatesTags: ['AdminUser'],
    }),
    activateUser: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/users/${id}/activate`, method: 'POST' }),
      invalidatesTags: ['AdminUser'],
    }),
    listAuditEvents: builder.query<ApiResponse<PaginatedResponse<AuditEventResponse>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => ({ url: '/admin/audit-events', params: { page, size } }),
      providesTags: ['AuditEvent'],
    }),
    listAuthEvents: builder.query<ApiResponse<PaginatedResponse<AuthEventResponse>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => ({ url: '/admin/auth-events', params: { page, size } }),
      providesTags: ['AuthEvent'],
    }),
    rebuildSearchSummary: builder.mutation<ApiResponse<void>, void>({
      query: () => ({ url: '/admin/search-summary/rebuild', method: 'POST' }),
    }),
    getPhysicalVerificationPending: builder.query<ApiResponse<PaginatedResponse<any>>, { page?: number; size?: number }>({
      query: ({ page = 0, size = 10 } = {}) => ({ url: '/admin/declarations/physical-verification-pending', params: { page, size } }),
    }),
  }),
})

export const {
  useListUsersQuery, useCreateUserMutation, useUpdateUserMutation,
  useDeactivateUserMutation, useActivateUserMutation,
  useListAuditEventsQuery, useListAuthEventsQuery,
  useRebuildSearchSummaryMutation, useGetPhysicalVerificationPendingQuery,
} = adminApi
