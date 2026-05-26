import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse } from '@/types'
import type {
  ChangeStatusRequest,
  CreateNoticeRequest,
  NoticeListFilter,
  NoticeListItemResponse,
  NoticeResponse,
  UpdateNoticeRequest,
} from './noticeTypes'

type NoticeListQuery = NoticeListFilter & { page?: number; size?: number }

export const noticeApi = createApi({
  reducerPath: 'noticeApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notice', 'NoticeList', 'NoticeDashboard'],
  endpoints: (builder) => ({

    // ── CRUD ─────────────────────────────────────────────────────────────────

    createNotice: builder.mutation<ApiResponse<NoticeResponse>, CreateNoticeRequest>({
      query: (body) => ({ url: '/notices', method: 'POST', body }),
      invalidatesTags: ['NoticeList', 'NoticeDashboard'],
    }),

    updateNotice: builder.mutation<ApiResponse<NoticeResponse>, { id: number; body: UpdateNoticeRequest }>({
      query: ({ id, body }) => ({ url: `/notices/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Notice', id }, 'NoticeList', 'NoticeDashboard'],
    }),

    changeNoticeStatus: builder.mutation<ApiResponse<NoticeResponse>, { id: number; body: ChangeStatusRequest }>({
      query: ({ id, body }) => ({ url: `/notices/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Notice', id }, 'NoticeList', 'NoticeDashboard'],
    }),

    deleteNotice: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/notices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['NoticeList', 'NoticeDashboard'],
    }),

    getNoticeById: builder.query<ApiResponse<NoticeResponse>, number>({
      query: (id) => `/notices/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Notice', id }],
    }),

    // ── Role-specific lists ───────────────────────────────────────────────────

    listDcNotices: builder.query<ApiResponse<PaginatedResponse<NoticeListItemResponse>>, NoticeListQuery>({
      query: ({ page = 0, size = 10, ...filters }) => ({
        url: '/notices/dc',
        params: { page, size, ...filters },
      }),
      providesTags: ['NoticeList'],
    }),

    listAdminNotices: builder.query<ApiResponse<PaginatedResponse<NoticeListItemResponse>>, NoticeListQuery>({
      query: ({ page = 0, size = 10, ...filters }) => ({
        url: '/notices/admin',
        params: { page, size, ...filters },
      }),
      providesTags: ['NoticeList'],
    }),

    listTaDashboardNotices: builder.query<ApiResponse<NoticeListItemResponse[]>, void>({
      query: () => '/notices/ta/dashboard',
      providesTags: ['NoticeDashboard'],
    }),

    // ── Attachments ───────────────────────────────────────────────────────────

    addNoticeAttachment: builder.mutation<ApiResponse<NoticeResponse>, { noticeId: number; file: File }>({
      query: ({ noticeId, file }) => {
        const formData = new FormData()
        formData.append('file', file)
        return { url: `/notices/${noticeId}/attachments`, method: 'POST', body: formData }
      },
      invalidatesTags: (_r, _e, { noticeId }) => [{ type: 'Notice', id: noticeId }, 'NoticeList'],
    }),

    removeNoticeAttachment: builder.mutation<ApiResponse<void>, { noticeId: number; attachmentId: number }>({
      query: ({ noticeId, attachmentId }) => ({
        url: `/notices/${noticeId}/attachments/${attachmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { noticeId }) => [{ type: 'Notice', id: noticeId }, 'NoticeList'],
    }),
  }),
})

export const {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useChangeNoticeStatusMutation,
  useDeleteNoticeMutation,
  useGetNoticeByIdQuery,
  useListDcNoticesQuery,
  useListAdminNoticesQuery,
  useListTaDashboardNoticesQuery,
  useAddNoticeAttachmentMutation,
  useRemoveNoticeAttachmentMutation,
} = noticeApi
