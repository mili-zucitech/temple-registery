import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface ObservationResponse {
  id: number; templeId: number; templeName?: string; entityType: string; entityId: number
  title: string; description: string; severity: string; status: string
  raisedByUserId: number; assignedToUserId?: number
  evidenceDocumentIds?: string; resolutionNote?: string
  closedAt?: string; createdAt: string; updatedAt: string
}

export interface CreateObservationRequest {
  templeId: number; entityType: string; entityId: number
  title: string; description: string; severity: string
}

export interface ComplianceAnomalyResponse {
  templeId: number; templeName: string; districtName?: string
  anomalyType: string; description: string; detectedAt: string
}

export interface AuditTrailEntry {
  source: string; action: string; entityType: string; entityId: number
  actorUserId?: number; actorRole?: string; detail?: string; timestamp: string
}

export const auditorApi = createApi({
  reducerPath: 'auditorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Observation'],
  endpoints: (builder) => ({
    listObservations: builder.query<ApiResponse<PaginatedResponse<ObservationResponse>>, { status?: string; page?: number; size?: number } | void>({
      query: (params) => ({ url: '/observations', params: params ?? {} }),
      providesTags: ['Observation'],
    }),
    listObservationsByTemple: builder.query<ApiResponse<PaginatedResponse<ObservationResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, ...params }) => ({ url: `/observations/temple/${templeId}`, params }),
      providesTags: ['Observation'],
    }),
    getObservation: builder.query<ApiResponse<ObservationResponse>, number>({
      query: (id) => ({ url: `/observations/${id}` }),
    }),
    createObservation: builder.mutation<ApiResponse<ObservationResponse>, CreateObservationRequest>({
      query: (body) => ({ url: '/observations', method: 'POST', body }),
      invalidatesTags: ['Observation'],
    }),
    // NOTE: assignObservation and closeObservation are ADMIN_ONLY operations.
    // They have been moved to adminApi.ts to reflect the correct permission boundary.
    // Auditors may only LIST and CREATE observations.
    getComplianceReport: builder.query<ApiResponse<ComplianceAnomalyResponse[]>, void>({
      query: () => ({ url: '/auditor/compliance' }),
    }),
    getAuditTrail: builder.query<ApiResponse<AuditTrailEntry[]>, { entityType: string; entityId: number; page?: number; size?: number }>({
      query: ({ entityType, entityId, ...params }) => ({ url: `/auditor/audit-trail/${entityType}/${entityId}`, params }),
    }),
  }),
})

export const {
  useListObservationsQuery,
  useListObservationsByTempleQuery,
  useGetObservationQuery,
  useCreateObservationMutation,
  useGetComplianceReportQuery,
  useGetAuditTrailQuery,
} = auditorApi
