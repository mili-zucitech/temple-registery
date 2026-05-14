import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '../../services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  TrustResponse, BoardMemberResponse, TrustFinancialResponse, BoardMeetingResponse, BoardMemberGroupResponse,
  CreateTrustRequest, CreateBoardMemberRequest, UpdateBoardMemberRequest,
  SubmitTrustFinancialRequest, CreateBoardMeetingRequest,
} from './trustTypes'

export const trustApi = createApi({
  reducerPath: 'trustApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Trust', 'BoardMember', 'TrustFinancial', 'BoardMeeting'],
  endpoints: (builder) => ({
    getTrustByTemple: builder.query<ApiResponse<TrustResponse[]>, number>({
      query: (templeId) => `/temples/${templeId}/trusts`,
      providesTags: (_r, _e, templeId) => [{ type: 'Trust', id: templeId }],
    }),
    createTrust: builder.mutation<ApiResponse<TrustResponse>, { templeId: number; body: CreateTrustRequest }>({
      query: ({ templeId, body }) => ({ url: `/temples/${templeId}/trusts`, method: 'POST', body }),
      invalidatesTags: ['Trust'],
    }),
    updateTrust: builder.mutation<ApiResponse<TrustResponse>, { trustId: number; body: Partial<CreateTrustRequest> }>({
      query: ({ trustId, body }) => ({ url: `/trusts/${trustId}`, method: 'PUT', body }),
      invalidatesTags: ['Trust'],
    }),

    // ── Board Members ─────────────────────────────────────────────────────────

    getBoardMembers: builder.query<ApiResponse<BoardMemberGroupResponse>, { trustId: number; current?: boolean }>({
      query: ({ trustId, current }) => ({ url: `/trusts/${trustId}/board-members`, params: current === undefined ? undefined : { current } }),
      providesTags: (_r, _e, { trustId }) => [{ type: 'BoardMember', id: trustId }],
    }),
    addBoardMember: builder.mutation<ApiResponse<BoardMemberResponse>, { trustId: number; body: CreateBoardMemberRequest }>({
      query: ({ trustId, body }) => ({ url: `/trusts/${trustId}/board-members`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'BoardMember', id: trustId }],
    }),
    updateBoardMember: builder.mutation<ApiResponse<BoardMemberResponse>, { memberId: number; trustId: number; body: UpdateBoardMemberRequest }>({
      query: ({ memberId, trustId, body }) => ({ url: `/trusts/${trustId}/board-members/${memberId}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'BoardMember', id: trustId }],
    }),
    deleteBoardMember: builder.mutation<ApiResponse<void>, { memberId: number; trustId: number }>({
      query: ({ memberId, trustId }) => ({ url: `/trusts/${trustId}/board-members/${memberId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'BoardMember', id: trustId }],
    }),

    // ── Trust Financials ──────────────────────────────────────────────────────

    listFinancials: builder.query<ApiResponse<TrustFinancialResponse[]>, { trustId: number }>({
      query: ({ trustId }) => ({ url: `/trusts/${trustId}/financials` }),
      providesTags: (_r, _e, { trustId }) => [{ type: 'TrustFinancial', id: trustId }],
    }),
    submitFinancial: builder.mutation<ApiResponse<TrustFinancialResponse>, { trustId: number; body: SubmitTrustFinancialRequest }>({
      query: ({ trustId, body }) => ({ url: `/trusts/${trustId}/financials`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'TrustFinancial', id: trustId }],
    }),

    // ── Board Meetings ────────────────────────────────────────────────────────

    listBoardMeetings: builder.query<ApiResponse<PaginatedResponse<BoardMeetingResponse>>, { trustId: number; page?: number; size?: number }>({
      query: ({ trustId, page = 0, size = 10 }) => ({ url: `/trusts/${trustId}/meetings`, params: { page, size } }),
      providesTags: (_r, _e, { trustId }) => [{ type: 'BoardMeeting', id: trustId }],
    }),
    getBoardMeeting: builder.query<ApiResponse<BoardMeetingResponse>, { trustId: number; meetingId: number }>({
      query: ({ trustId, meetingId }) => `/trusts/${trustId}/meetings/${meetingId}`,
      providesTags: (_r, _e, { meetingId }) => [{ type: 'BoardMeeting', id: meetingId }],
    }),
    createBoardMeeting: builder.mutation<ApiResponse<BoardMeetingResponse>, { trustId: number; body: CreateBoardMeetingRequest }>({
      query: ({ trustId, body }) => ({ url: `/trusts/${trustId}/meetings`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'BoardMeeting', id: trustId }],
    }),
    uploadMeetingMinutes: builder.mutation<ApiResponse<BoardMeetingResponse>, { trustId: number; meetingId: number; body: FormData }>({
      query: ({ trustId, meetingId, body }) => ({ url: `/trusts/${trustId}/meetings/${meetingId}/minutes`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'BoardMeeting', id: trustId }],
    }),
  }),
})

export const {
  useGetTrustByTempleQuery, useCreateTrustMutation, useUpdateTrustMutation,
  useGetBoardMembersQuery, useAddBoardMemberMutation, useUpdateBoardMemberMutation, useDeleteBoardMemberMutation,
  useListFinancialsQuery, useSubmitFinancialMutation,
  useListBoardMeetingsQuery, useGetBoardMeetingQuery, useCreateBoardMeetingMutation, useUploadMeetingMinutesMutation,
} = trustApi
