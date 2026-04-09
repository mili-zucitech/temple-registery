import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export interface DocumentResponse {
  id: number; ownerType: string; ownerId: number
  originalFilename: string; mimeType: string; fileSizeBytes: number
  documentLabel?: string; createdAt: string
}

export interface DocumentUrlResponse {
  documentId: number; url: string; expiresIn: string; generatedAt: string
}

export const documentApi = createApi({
  reducerPath: 'documentApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Document'],
  endpoints: (builder) => ({
    listDocuments: builder.query<ApiResponse<PaginatedResponse<DocumentResponse>>, { ownerType: string; ownerId: number; page?: number; size?: number }>({
      query: ({ ownerType, ownerId, page = 0, size = 10 }) => ({
        url: '/documents',
        params: { ownerType, ownerId, page, size },
      }),
      providesTags: ['Document'],
    }),
    getDocumentById: builder.query<ApiResponse<DocumentResponse>, number>({
      query: (id) => `/documents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Document', id }],
    }),
    getDocumentUrl: builder.query<ApiResponse<DocumentUrlResponse>, number>({
      query: (id) => `/documents/${id}/url`,
    }),
    uploadDocument: builder.mutation<ApiResponse<DocumentResponse>, FormData>({
      query: (body) => ({ url: '/documents/upload', method: 'POST', body }),
      invalidatesTags: ['Document'],
    }),
    softDeleteDocument: builder.mutation<void, number>({
      query: (id) => ({ url: `/documents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Document'],
    }),
  }),
})

export const {
  useListDocumentsQuery, useGetDocumentByIdQuery, useGetDocumentUrlQuery,
  useUploadDocumentMutation, useSoftDeleteDocumentMutation,
} = documentApi
