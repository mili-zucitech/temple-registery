import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse } from '@/types'
import type {
  StateResponse, CityResponse, DistrictResponse, TalukResponse, HobliResponse,
} from './geoTypes'

export const geoApi = createApi({
  reducerPath: 'geoApi',
  baseQuery: baseQueryWithReauth,
  keepUnusedDataFor: 600, // geo data is slow-changing — cache for 10 min
  tagTypes: ['Geo'],
  endpoints: (builder) => ({
    getStates: builder.query<ApiResponse<StateResponse[]>, void>({
      query: () => '/geo/states',
      providesTags: ['Geo'],
    }),
    getCities: builder.query<ApiResponse<CityResponse[]>, number>({
      query: (stateId) => `/geo/states/${stateId}/cities`,
      providesTags: ['Geo'],
    }),
    getDistricts: builder.query<ApiResponse<DistrictResponse[]>, number>({
      query: (cityId) => `/geo/cities/${cityId}/districts`,
      providesTags: ['Geo'],
    }),
    getDistrictsByState: builder.query<ApiResponse<DistrictResponse[]>, number>({
      query: (stateId) => `/geo/states/${stateId}/districts`,
      providesTags: ['Geo'],
    }),
    getTaluks: builder.query<ApiResponse<TalukResponse[]>, number>({
      query: (districtId) => `/geo/districts/${districtId}/taluks`,
      providesTags: ['Geo'],
    }),
    getHoblis: builder.query<ApiResponse<HobliResponse[]>, number>({
      query: (talukId) => `/geo/taluks/${talukId}/hoblis`,
      providesTags: ['Geo'],
    }),
    createState: builder.mutation<ApiResponse<StateResponse>, { name: string; code?: string }>({
      query: (body) => ({ url: '/geo/states', method: 'POST', body }),
      invalidatesTags: ['Geo'],
    }),
    createCity: builder.mutation<ApiResponse<CityResponse>, { name: string; stateId: number }>({
      query: (body) => ({ url: '/geo/cities', method: 'POST', body }),
      invalidatesTags: ['Geo'],
    }),
    createDistrict: builder.mutation<ApiResponse<DistrictResponse>, { name: string; code?: string; cityId: number }>({
      query: (body) => ({ url: '/geo/districts', method: 'POST', body }),
      invalidatesTags: ['Geo'],
    }),
    createTaluk: builder.mutation<ApiResponse<TalukResponse>, { name: string; districtId: number }>({
      query: (body) => ({ url: '/geo/taluks', method: 'POST', body }),
      invalidatesTags: ['Geo'],
    }),
    createHobli: builder.mutation<ApiResponse<HobliResponse>, { name: string; talukId: number }>({
      query: (body) => ({ url: '/geo/hoblis', method: 'POST', body }),
      invalidatesTags: ['Geo'],
    }),
  }),
})

export const {
  useGetStatesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
  useGetDistrictsByStateQuery,
  useGetTaluksQuery,
  useGetHoblisQuery,
  useCreateStateMutation,
  useCreateCityMutation,
  useCreateDistrictMutation,
  useCreateTalukMutation,
  useCreateHobliMutation,
} = geoApi
