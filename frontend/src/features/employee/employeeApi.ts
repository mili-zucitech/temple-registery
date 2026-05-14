import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { EmployeeResponse, CreateEmployeeRequest, UpdateEmployeeRequest } from './employeeTypes'

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee'],
  endpoints: (builder) => ({
    listEmployees: builder.query<ApiResponse<PaginatedResponse<EmployeeResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, page = 0, size = 10 }) => ({ url: `/temples/${templeId}/employees`, params: { page, size } }),
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query<ApiResponse<EmployeeResponse>, number>({
      query: (id) => `/employees/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: builder.mutation<ApiResponse<EmployeeResponse>, { templeId: number; body: CreateEmployeeRequest }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/employees`, method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation<ApiResponse<EmployeeResponse>, { id: number; body: UpdateEmployeeRequest }>({
      query: ({ id, body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Employee'],
    }),
    deleteEmployee: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const {
  useListEmployeesQuery,
  useGetEmployeeByIdQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} = employeeApi
