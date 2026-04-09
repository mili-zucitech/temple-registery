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
    getTaluks: builder.query<ApiResponse<TalukResponse[]>, number>({
      query: (districtId) => `/geo/districts/${districtId}/taluks`,
      providesTags: ['Geo'],
    }),
    getHoblis: builder.query<ApiResponse<HobliResponse[]>, number>({
      query: (talukId) => `/geo/taluks/${talukId}/hoblis`,
      providesTags: ['Geo'],
    }),
  }),
})

export const {
  useGetStatesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
  useGetTaluksQuery,
  useGetHoblisQuery,
} = geoApi
