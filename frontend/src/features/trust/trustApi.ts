import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface TrustResponse {
  id: number; templeId: number; trustName: string; trustType: string
  registrationNumber?: string; registeredDate?: string; bankName?: string; bankIfsc?: string
}
export interface BoardMemberResponse {
  id: number; trustId: number; fullName: string; designation?: string
  mobile?: string; maskedAadhaar?: string
}
export interface TrustFinancialResponse {
  id: number; trustId: number; financialYear: string
  totalIncome?: number; totalExpenditure?: number; surplusDeficit?: number
}

export const trustApi = createApi({
  reducerPath: 'trustApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Trust', 'BoardMember', 'TrustFinancial'],
  endpoints: (builder) => ({
    getTrustByTemple: builder.query<ApiResponse<TrustResponse>, number>({
      query: (templeId) => `/temples/${templeId}/trusts`,
      providesTags: (_r, _e, templeId) => [{ type: 'Trust', id: templeId }],
    }),
    getBoardMembers: builder.query<ApiResponse<PaginatedResponse<BoardMemberResponse>>, { trustId: number; page?: number; size?: number }>({
      query: ({ trustId, page = 0, size = 10 }) => ({ url: `/trusts/${trustId}/board-members`, params: { page, size } }),
      providesTags: (_r, _e, { trustId }) => [{ type: 'BoardMember', id: trustId }],
    }),
    getTrustFinancials: builder.query<ApiResponse<PaginatedResponse<TrustFinancialResponse>>, { trustId: number; page?: number; size?: number }>({
      query: ({ trustId, page = 0, size = 10 }) => ({ url: `/trusts/${trustId}/financials`, params: { page, size } }),
      providesTags: (_r, _e, { trustId }) => [{ type: 'TrustFinancial', id: trustId }],
    }),
    createTrust: builder.mutation<ApiResponse<TrustResponse>, { templeId: number; body: Partial<TrustResponse> }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/trusts`, method: 'POST', body }),
      invalidatesTags: ['Trust'],
    }),
  }),
})

export const { useGetTrustByTempleQuery, useGetBoardMembersQuery, useGetTrustFinancialsQuery, useCreateTrustMutation } = trustApi
