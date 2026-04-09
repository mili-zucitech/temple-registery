import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'

export type EmployeeType = 'PRIEST' | 'ADMINISTRATIVE' | 'MAINTENANCE' | 'SECURITY'
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'RETIRED'

export interface EmployeeResponse {
  id: number; templeId: number; fullName: string; employeeType: EmployeeType
  status: EmployeeStatus; designation?: string; mobile?: string; joiningDate?: string
}

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee'],
  endpoints: (builder) => ({
    listEmployees: builder.query<ApiResponse<PaginatedResponse<EmployeeResponse>>, { templeId: number; page?: number; size?: number }>({
      query: ({ templeId, page = 0, size = 10 }) => ({ url: `/temples/${templeId}/employees`, params: { page, size } }),
      providesTags: ['Employee'],
    }),
    createEmployee: builder.mutation<ApiResponse<EmployeeResponse>, { templeId: number; body: Partial<EmployeeResponse> }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/employees`, method: 'POST', body }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation<ApiResponse<EmployeeResponse>, { id: number; body: Partial<EmployeeResponse> }>({
      query: ({ id, body }) => ({ url: `/employees/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Employee'],
    }),
    deleteEmployee: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),
  }),
})

export const { useListEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation, useDeleteEmployeeMutation } = employeeApi
