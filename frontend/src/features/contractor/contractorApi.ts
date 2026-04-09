import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { ContractorResponse, CreateContractorRequest, UpdateContractorRequest } from './contractorTypes'

export const contractorApi = createApi({
  reducerPath: 'contractorApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Contractor'],
  endpoints: (builder) => ({
    listContractors: builder.query<ApiResponse<PaginatedResponse<ContractorResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, page = 0, size = 10 }) => ({ url: `/temples/${templeId}/contractors`, params: { page, size } }),
      providesTags: ['Contractor'],
    }),
    getContractorById: builder.query<ApiResponse<ContractorResponse>, number>({
      query: (id) => `/contractors/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Contractor', id }],
    }),
    createContractor: builder.mutation<ApiResponse<ContractorResponse>, { templeId: number; body: CreateContractorRequest }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/contractors`, method: 'POST', body }),
      invalidatesTags: ['Contractor'],
    }),
    updateContractor: builder.mutation<ApiResponse<ContractorResponse>, { id: number; body: UpdateContractorRequest }>({
      query: ({ id, body }) => ({ url: `/contractors/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Contractor'],
    }),
    deleteContractor: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/contractors/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Contractor'],
    }),
  }),
})

export const {
  useListContractorsQuery, useGetContractorByIdQuery,
  useCreateContractorMutation, useUpdateContractorMutation, useDeleteContractorMutation,
} = contractorApi
