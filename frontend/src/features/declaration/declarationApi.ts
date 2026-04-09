import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  DeclarationResponse, CreateDeclarationRequest, ClarificationRequest, AcknowledgementResponse,
} from './declarationTypes'

export const declarationApi = createApi({
  reducerPath: 'declarationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Declaration'],
  endpoints: (builder) => ({
    listAllDeclarations: builder.query<ApiResponse<PaginatedResponse<DeclarationResponse>>, { page?: number; size?: number; status?: string }>({      query: ({ page = 0, size = 10, status }) => ({ url: '/declarations', params: { page, size, status } }),
      providesTags: ['Declaration'],
    }),
    listDeclarations: builder.query<ApiResponse<PaginatedResponse<DeclarationResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, page = 0, size = 10 }) => ({ url: `/temples/${templeId}/declarations`, params: { page, size } }),
      providesTags: ['Declaration'],
    }),
    getDeclaration: builder.query<ApiResponse<DeclarationResponse>, number>({
      query: (id) => `/declarations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Declaration', id }],
    }),
    createDeclaration: builder.mutation<ApiResponse<DeclarationResponse>, { templeId: number; body: CreateDeclarationRequest }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/declarations`, method: 'POST', body }),
      invalidatesTags: ['Declaration'],
    }),
    updateDeclaration: builder.mutation<ApiResponse<DeclarationResponse>, { id: number; body: CreateDeclarationRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }],
    }),
    submitDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/declarations/${id}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    approveDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/declarations/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    rejectDeclaration: builder.mutation<ApiResponse<void>, { id: number; body: ClarificationRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}/reject`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    requestClarification: builder.mutation<ApiResponse<void>, { id: number; body: ClarificationRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}/clarification`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    resubmitDeclaration: builder.mutation<ApiResponse<void>, { id: number; body: ClarificationRequest & CreateDeclarationRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}/resubmit`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    getAcknowledgement: builder.query<ApiResponse<AcknowledgementResponse>, number>({
      query: (id) => `/declarations/${id}/acknowledgement`,
    }),
  }),
})

export const {
  useListAllDeclarationsQuery, useListDeclarationsQuery, useGetDeclarationQuery, useCreateDeclarationMutation,
  useUpdateDeclarationMutation, useSubmitDeclarationMutation, useApproveDeclarationMutation,
  useRejectDeclarationMutation, useRequestClarificationMutation,
  useResubmitDeclarationMutation, useGetAcknowledgementQuery,
} = declarationApi
