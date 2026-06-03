import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse } from '@/types'
import type { ComplianceAnomalyResponse } from '@/features/auditor/auditorApi'

export interface ViewerDashboardResponse {
  complianceAnomalyCount: number
  overdueDeclarationCount: number
  openObservationCount: number
  assignedObservationCount: number
  complianceScore: number
  workloadStatus: string
  recentAnomalies: ComplianceAnomalyResponse[]
}

export const viewerApi = createApi({
  reducerPath: 'viewerApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [],
  endpoints: (builder) => ({
    getViewerDashboard: builder.query<ApiResponse<ViewerDashboardResponse>, void>({
      query: () => ({ url: '/viewer/dashboard' }),
    }),
  }),
})

export const { useGetViewerDashboardQuery } = viewerApi
