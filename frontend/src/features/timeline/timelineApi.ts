import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type { TempleTimelineEventResponse } from './timelineTypes'

export interface GetTempleTimelineParams {
  templeId: number
  page?: number
  size?: number
}

/**
 * RTK Query API for the read-only temple timeline / audit trail.
 *
 * Endpoint:
 *   GET /api/v1/timeline/temples/{templeId}?page=0&size=20
 *
 * Cache strategy: 1 minute TTL. Timeline is append-only so short cache is fine.
 * Tag 'TempleTimeline' allows targeted invalidation if needed in future.
 */
export const timelineApi = createApi({
  reducerPath: 'timelineApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['TempleTimeline'],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getTempleTimeline: builder.query<
      ApiResponse<PaginatedResponse<TempleTimelineEventResponse>>,
      GetTempleTimelineParams
    >({
      query: ({ templeId, page = 0, size = 20 }) =>
        `/timeline/temples/${templeId}?page=${page}&size=${size}`,
      providesTags: (_result, _error, { templeId }) => [
        { type: 'TempleTimeline', id: templeId },
      ],
    }),
  }),
})

export const { useGetTempleTimelineQuery } = timelineApi
