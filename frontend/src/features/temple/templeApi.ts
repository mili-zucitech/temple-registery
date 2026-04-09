import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  TempleResponse, TempleSearchResultResponse, CreateTempleRequest, TempleSearchFilterRequest,
} from './templeTypes'

export const templeApi = createApi({
  reducerPath: 'templeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Temple', 'TempleSearch'],
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
  }),
})

export const {
  useSearchTemplesQuery,
  useGetTempleByIdQuery,
  useCreateTempleMutation,
  useUpdateTempleMutation,
} = templeApi
