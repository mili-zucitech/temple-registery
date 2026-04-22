import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  AcknowledgementResponse,
  ClarificationRequest,
  CompleteDeclarationResponse,
  CreateDeclarationRequest,
  DeclarationDiffItem,
  DeclarationResponse,
  DeclarationVersionResponse,
  ResubmitDeclarationRequest,
} from './declarationTypes'

type DeclarationListQuery = { page?: number; size?: number; status?: string; financialYear?: string }

export const declarationApi = createApi({
  reducerPath: 'declarationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Declaration'],
  endpoints: (builder) => ({
    listAllDeclarations: builder.query<ApiResponse<PaginatedResponse<DeclarationResponse>>, DeclarationListQuery>({
      query: ({ page = 0, size = 10, status, financialYear }) => ({
        url: '/dc/declarations',
        params: { page, size, status, financialYear },
      }),
      providesTags: ['Declaration'],
    }),
    listDeclarations: builder.query<ApiResponse<PaginatedResponse<DeclarationResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, page = 0, size = 10 }) => ({ url: `/temples/${templeId}/declarations`, params: { page, size } }),
      providesTags: ['Declaration'],
    }),
    getDeclaration: builder.query<ApiResponse<CompleteDeclarationResponse>, number>({
      query: (id) => `/declarations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Declaration', id }],
    }),
    getDeclarationVersions: builder.query<ApiResponse<DeclarationVersionResponse[]>, number>({
      query: (id) => `/declarations/${id}/versions`,
      providesTags: (_r, _e, id) => [{ type: 'Declaration', id: `versions-${id}` }],
    }),
    createDeclaration: builder.mutation<ApiResponse<CompleteDeclarationResponse>, { templeId: number; body: CreateDeclarationRequest }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/declarations`, method: 'POST', body }),
      invalidatesTags: ['Declaration'],
    }),
    updateDeclaration: builder.mutation<ApiResponse<CompleteDeclarationResponse>, { id: number; body: CreateDeclarationRequest }>({
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
    resubmitDeclaration: builder.mutation<ApiResponse<CompleteDeclarationResponse>, { id: number; body: ResubmitDeclarationRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}/resubmit`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    getAcknowledgement: builder.query<ApiResponse<AcknowledgementResponse>, number>({
      query: (id) => `/declarations/${id}/acknowledgement`,
    }),
    getDeclarationDiff: builder.query<ApiResponse<DeclarationDiffItem[]>, { id: number; compareToVersion?: number }>({
      query: ({ id, compareToVersion }) => ({
        url: `/declarations/${id}/diff`,
        params: compareToVersion ? { compareToVersion } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Declaration', id: `diff-${id}` }],
    }),
  }),
})

export const {
  useListAllDeclarationsQuery,
  useListDeclarationsQuery,
  useGetDeclarationQuery,
  useGetDeclarationVersionsQuery,
  useCreateDeclarationMutation,
  useUpdateDeclarationMutation,
  useSubmitDeclarationMutation,
  useApproveDeclarationMutation,
  useRejectDeclarationMutation,
  useRequestClarificationMutation,
  useResubmitDeclarationMutation,
  useGetAcknowledgementQuery,
  useGetDeclarationDiffQuery,
} = declarationApi
