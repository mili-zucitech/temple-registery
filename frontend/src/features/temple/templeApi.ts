import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  TempleResponse, TempleSearchResultResponse, CreateTempleRequest, TempleSearchFilterRequest,
  TempleProfileStagingResponse, CreateTempleProfileStagingRequest, TaCurrentProfileResponse,
} from './templeTypes'

export const templeApi = createApi({
  reducerPath: 'templeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Temple', 'TempleSearch', 'TempleStaging', 'TempleCurrentProfile'],
  endpoints: (builder) => ({
    searchTemples: builder.query<
      ApiResponse<PaginatedResponse<TempleSearchResultResponse>>,
      { filters: TempleSearchFilterRequest; page: number; size: number }
    >({
      query: ({ filters, page, size }) => ({
        url: '/temples',
        params: { ...filters, page, size },
      }),
      providesTags: ['TempleSearch'],
    }),

    getTempleById: builder.query<ApiResponse<TempleResponse>, number>({
      query: (id) => `/temples/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Temple', id }],
    }),

    createTemple: builder.mutation<ApiResponse<TempleResponse>, CreateTempleRequest>({
      query: (body) => ({ url: '/temples', method: 'POST', body }),
      invalidatesTags: ['TempleSearch'],
    }),

    updateTemple: builder.mutation<ApiResponse<TempleResponse>, { id: number; body: Partial<CreateTempleRequest> }>({
      query: ({ id, body }) => ({ url: `/temples/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Temple', id }, 'TempleSearch'],
    }),

    // ── Temple Profile Staging Workflow (TA → DC) ──────────────────────────

    getActiveStaging: builder.query<ApiResponse<TempleProfileStagingResponse | null>, number>({
      query: (templeId) => `/temples/${templeId}/profile/staging/active`,
      providesTags: (_r, _e, templeId) => [{ type: 'TempleStaging', id: templeId }],
    }),

    createOrUpdateDraft: builder.mutation<
      ApiResponse<TempleProfileStagingResponse>,
      { templeId: number; body: CreateTempleProfileStagingRequest }
    >({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/profile/staging`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'TempleStaging', id: templeId },
        { type: 'Temple', id: templeId },
      ],
    }),

    submitForReview: builder.mutation<ApiResponse<TempleProfileStagingResponse>, number>({
      query: (templeId) => ({ url: `/temples/${templeId}/profile/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, templeId) => [{ type: 'TempleStaging', id: templeId }],
    }),

    getStagingHistory: builder.query<
      ApiResponse<PaginatedResponse<TempleProfileStagingResponse>>,
      { templeId: number; page?: number; size?: number }
    >({
      query: ({ templeId, page = 0, size = 10 }) => ({
        url: `/temples/${templeId}/profile/history`,
        params: { page, size },
      }),
      providesTags: (_r, _e, { templeId }) => [{ type: 'TempleStaging', id: `history-${templeId}` }],
    }),

    getTempleCurrentProfile: builder.query<ApiResponse<TaCurrentProfileResponse | null>, number>({
      query: (templeId) => `/temples/${templeId}/profile/current`,
      providesTags: (_r, _e, templeId) => [{ type: 'TempleCurrentProfile', id: templeId }],
    }),
  }),
})

export const {
  useSearchTemplesQuery,
  useGetTempleByIdQuery,
  useCreateTempleMutation,
  useUpdateTempleMutation,
  useGetActiveStagingQuery,
  useCreateOrUpdateDraftMutation,
  useSubmitForReviewMutation,
  useGetStagingHistoryQuery,
  useGetTempleCurrentProfileQuery,
} = templeApi
