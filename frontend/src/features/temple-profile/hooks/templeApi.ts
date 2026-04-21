import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import { CreateTempleRequest, TaProfileStagingRequest, TemplePhotoDto, TempleProfileStagingResponse, TempleResponse, TempleSearchFilterRequest, TempleSearchResultResponse } from './templeTypes';


export const templeApi = createApi({
  reducerPath: 'templeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Temple', 'TempleSearch', 'TempleStaging', 'TempleCurrentProfile', 'TemplePhotos'],
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

    updateTemple: builder.mutation<ApiResponse<TempleResponse>, { id: number; body: CreateTempleRequest }>({
      query: ({ id, body }) => ({
        url: `/temples/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Temple', id }, 'TempleSearch'],
    }),

    getActiveStaging: builder.query<ApiResponse<TempleProfileStagingResponse | null>, number>({
      query: (templeId) => `/temples/${templeId}/profile/staging/active`,
      providesTags: (_r, _e, templeId) => [{ type: 'TempleStaging', id: `active-${templeId}` }],
    }),

    createOrUpdateDraft: builder.mutation<
      ApiResponse<TempleProfileStagingResponse>,
      { templeId: number; body: TaProfileStagingRequest }
    >({
      query: ({ templeId, body }) => ({
        url: `/temples/${templeId}/profile/staging`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'TempleStaging', id: `active-${templeId}` }],
    }),

    submitForReview: builder.mutation<ApiResponse<TempleProfileStagingResponse>, number>({
      query: (templeId) => ({
        url: `/temples/${templeId}/profile/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, templeId) => [
        { type: 'TempleStaging', id: `active-${templeId}` },
        { type: 'TempleCurrentProfile', id: templeId },
        { type: 'Temple', id: templeId },
      ],
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

    getTempleCurrentProfile: builder.query<ApiResponse<TempleResponse | null>, number>({
      query: (templeId) => `/temples/${templeId}/profile/current`,
      providesTags: (_r, _e, templeId) => [{ type: 'TempleCurrentProfile', id: templeId }],
    }),

    uploadTemplePhoto: builder.mutation<ApiResponse<string>, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData()
        formData.append('file', file)
        return {
          url: `/temples/${id}/photo`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Temple', id }, { type: 'TempleStaging', id }],
    }),

    uploadTemplePhotos: builder.mutation<ApiResponse<string[]>, { id: number; files: File[] }>({
      query: ({ id, files }) => {
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        return {
          url: `/temples/${id}/photos`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Temple', id },
        { type: 'TempleStaging', id },
        { type: 'TemplePhotos', id },
      ],
    }),

    getTemplePhotos: builder.query<ApiResponse<TemplePhotoDto[]>, number>({
      query: (id) => `/temples/${id}/photos`,
      providesTags: (_r, _e, id) => [{ type: 'TemplePhotos', id }],
    }),

    deleteTemplePhoto: builder.mutation<ApiResponse<void>, { templeId: number; photoId: number }>({
      query: ({ templeId, photoId }) => ({
        url: `/temples/${templeId}/photos/${photoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { templeId }) => [{ type: 'TemplePhotos', id: templeId }],
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
  useUploadTemplePhotoMutation,
  useUploadTemplePhotosMutation,
  useGetTemplePhotosQuery,
  useDeleteTemplePhotoMutation,
} = templeApi