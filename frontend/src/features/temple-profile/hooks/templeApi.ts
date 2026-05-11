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
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'TempleStaging', id: `active-${templeId}` },
        { type: 'TempleStaging', id: `history-${templeId}` },
      ],
    }),

    submitForReview: builder.mutation<ApiResponse<TempleProfileStagingResponse>, number>({
      query: (templeId) => ({
        url: `/temples/${templeId}/profile/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, templeId) => [
        { type: 'TempleStaging', id: `active-${templeId}` },
        { type: 'TempleStaging', id: `history-${templeId}` },
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
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TemplePhotos', id },
        { type: 'Temple', id },
      ],
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
      // Invalidate TemplePhotos so the gallery refreshes. Also invalidate Temple so that
      // temple.photoUrl updates after the first primary photo is uploaded. The TaTempleEditPage
      // guards against re-initializing the form via isFormInitialized.current, so this is safe.
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'TemplePhotos', id },
        { type: 'Temple', id },
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
      // Invalidate TemplePhotos AND Temple: if the deleted photo was the primary,
      // temple.photoUrl changes and the profile photo serve endpoint must re-evaluate.
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'TemplePhotos', id: templeId },
        { type: 'Temple', id: templeId },
      ],
    }),

    deleteProfileStaging: builder.mutation<ApiResponse<void>, { templeId: number; stagingId: number }>({
      query: ({ templeId, stagingId }) => ({
        url: `/temples/${templeId}/profile/staging/${stagingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { templeId }) => [
        { type: 'TempleStaging', id: `active-${templeId}` },
        { type: 'TempleStaging', id: `history-${templeId}` },
      ],
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
  useDeleteProfileStagingMutation,
} = templeApi