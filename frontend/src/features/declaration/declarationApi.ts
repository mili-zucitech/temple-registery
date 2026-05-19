import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  AcknowledgementResponse,
  ChatMessage,
  ClarificationRequest,
  ClarificationRespondRequest,
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
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    submitDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/governance/declarations/${id}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    // DC actions — all routed through governance controller
    approveDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/governance/declarations/${id}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    rejectDeclaration: builder.mutation<ApiResponse<void>, { id: number; body: ClarificationRequest }>({
      query: ({ id, body }) => ({ url: `/governance/declarations/${id}/reject`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    requestClarification: builder.mutation<ApiResponse<void>, { id: number; body: ClarificationRequest }>({
      query: ({ id, body }) => ({ url: `/governance/declarations/${id}/clarify`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    // TA action — respond to clarification (replaces resubmit)
    clarificationRespond: builder.mutation<ApiResponse<CompleteDeclarationResponse>, { id: number; body: ClarificationRespondRequest }>({
      query: ({ id, body }) => ({ url: `/declarations/${id}/clarification-respond`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    // Kept for backward compatibility with existing components that use resubmit
    // Maps clarificationResponse → message (backend only accepts { message })
    resubmitDeclaration: builder.mutation<ApiResponse<CompleteDeclarationResponse>, { id: number; body: ResubmitDeclarationRequest }>({
      query: ({ id, body }) => ({
        url: `/declarations/${id}/clarification-respond`,
        method: 'POST',
        body: { message: body.clarificationResponse },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    // DC site visit flow — governance controller
    scheduleSiteVisit: builder.mutation<ApiResponse<void>, { id: number; body?: { notes?: string } }>({
      query: ({ id, body }) => ({ url: `/governance/declarations/${id}/schedule-site-visit`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    completeSiteVisit: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/governance/declarations/${id}/complete-site-visit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    verifyDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/governance/declarations/${id}/verify`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    failSiteVisit: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/governance/declarations/${id}/fail-site-visit`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'Declaration', id }, 'Declaration'],
    }),
    getAcknowledgement: builder.query<ApiResponse<AcknowledgementResponse>, number>({
      query: (id) => `/declarations/${id}/acknowledgement`,
    }),
    downloadAcknowledgement: builder.mutation<Blob, number>({
      query: (id) => ({
        url: `/declarations/${id}/acknowledgement/download`,
        responseHandler: async (response) => {
          const contentType = response.headers.get('content-type') ?? ''

          if (!response.ok) {
            if (contentType.includes('application/json')) {
              return response.json()
            }

            const message = await response.text()
            return {
              message: message || 'Failed to download acknowledgement.',
            }
          }

          return response.blob()
        },
      }),
    }),
    getDeclarationDiff: builder.query<ApiResponse<DeclarationDiffItem[]>, { id: number; compareToVersion?: number }>({
      query: ({ id, compareToVersion }) => ({
        url: `/declarations/${id}/diff`,
        params: compareToVersion ? { compareToVersion } : undefined,
      }),
      providesTags: (_r, _e, { id }) => [{ type: 'Declaration', id: `diff-${id}` }],
    }),
    getConversation: builder.query<ApiResponse<ChatMessage[]>, number>({
      query: (id) => `/declarations/${id}/conversation`,
      providesTags: (_r, _e, id) => [{ type: 'Declaration', id: `conversation-${id}` }],
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
  useClarificationRespondMutation,
  useResubmitDeclarationMutation,
  useScheduleSiteVisitMutation,
  useCompleteSiteVisitMutation,
  useVerifyDeclarationMutation,
  useFailSiteVisitMutation,
  useGetAcknowledgementQuery,
  useLazyGetAcknowledgementQuery,
  useDownloadAcknowledgementMutation,
  useGetDeclarationDiffQuery,
  useGetConversationQuery,
} = declarationApi
