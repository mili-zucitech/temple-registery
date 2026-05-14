import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryV2WithReauth } from '../../services/baseQueryV2WithReauth'
import type {
  WorkflowStateResponse,
  WorkflowActionRequest,
  WorkflowTransitionResult,
  ClarificationThread,
  WorkflowTransitionHistory,
  WorkflowInstance,
} from '../../types/workflow'
import type { PaginatedResponse } from '../../types/api'

const uuidv4 = () => crypto.randomUUID()

/**
 * RTK Query API slice for the unified Workflow Engine v2.
 * All modules (Trust, Declaration, Temple Profile, Board Member) use this.
 */
export const workflowApi = createApi({
  reducerPath: 'workflowApi',
  baseQuery: baseQueryV2WithReauth,
  tagTypes: ['WorkflowState', 'ClarificationThread', 'WorkflowHistory', 'Dashboard', 'BadgeCount'],

  endpoints: (builder) => ({

    // ─── Workflow State ─────────────────────────────────────────────────────

    getWorkflowState: builder.query<WorkflowStateResponse, number>({
      query: (instanceId) => `/api/v2/workflow/${instanceId}`,
      transformResponse: (res: any) => res.data ?? res,
      providesTags: (_, __, instanceId) => [{ type: 'WorkflowState', id: instanceId }],
    }),

    // ─── Execute Action ─────────────────────────────────────────────────────

    executeAction: builder.mutation<WorkflowTransitionResult, {
      instanceId: number
      action: WorkflowActionRequest
    }>({
      query: ({ instanceId, action }) => ({
        url: `/api/v2/workflow/${instanceId}/action`,
        method: 'POST',
        body: {
          ...action,
          idempotencyKey: action.idempotencyKey ?? uuidv4(),
        },
      }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: (_, __, { instanceId }) => [
        { type: 'WorkflowState', id: instanceId },
        { type: 'WorkflowHistory', id: instanceId },
        'Dashboard',
        'BadgeCount',
      ],
    }),

    // ─── Clarification ──────────────────────────────────────────────────────

    getClarificationThreads: builder.query<ClarificationThread[], number>({
      query: (instanceId) => `/api/v2/workflow/${instanceId}/clarification`,
      transformResponse: (res: any) => res.data ?? res,
      providesTags: (_, __, instanceId) => [{ type: 'ClarificationThread', id: instanceId }],
    }),

    requestClarification: builder.mutation<ClarificationThread, {
      instanceId: number
      message: string
      sectionName?: string
      fieldNames?: string[]
    }>({
      query: ({ instanceId, ...body }) => ({
        url: `/api/v2/workflow/${instanceId}/clarification`,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.data ?? res,
      invalidatesTags: (_, __, { instanceId }) => [
        { type: 'ClarificationThread', id: instanceId },
        { type: 'WorkflowState', id: instanceId },
        'BadgeCount',
      ],
    }),

    respondToClarification: builder.mutation<void, {
      instanceId: number
      threadId: number
      message: string
      attachmentPaths?: string[]
      attachmentNames?: string[]
    }>({
      query: ({ instanceId, threadId, ...body }) => ({
        url: `/api/v2/workflow/${instanceId}/clarification/${threadId}/respond`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_, __, { instanceId }) => [
        { type: 'ClarificationThread', id: instanceId },
        { type: 'WorkflowState', id: instanceId },
        'BadgeCount',
      ],
    }),

    resolveThread: builder.mutation<void, { instanceId: number; threadId: number }>({
      query: ({ instanceId, threadId }) => ({
        url: `/api/v2/workflow/${instanceId}/clarification/${threadId}/resolve`,
        method: 'POST',
      }),
      invalidatesTags: (_, __, { instanceId }) => [
        { type: 'ClarificationThread', id: instanceId },
        { type: 'WorkflowState', id: instanceId },
      ],
    }),

    // ─── Dashboard ──────────────────────────────────────────────────────────

    getWorkflowDashboard: builder.query<PaginatedResponse<WorkflowInstance>, {
      districtId?: number
      templeId?: number
      entityTypes?: string[]
      statuses?: string[]
      page?: number
      size?: number
    }>({
      query: (params) => ({
        url: '/api/v2/workflow/dashboard',
        params,
      }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ['Dashboard'],
    }),

    // ─── Badge Count ────────────────────────────────────────────────────────

    getPendingCount: builder.query<{ pendingCount: number }, {
      districtId?: number
      templeId?: number
    }>({
      query: (params) => ({ url: '/api/v2/workflow/count/pending', params }),
      transformResponse: (res: any) => res.data ?? res,
      providesTags: ['BadgeCount'],
    }),

    // ─── Audit History ──────────────────────────────────────────────────────

    getWorkflowHistory: builder.query<WorkflowTransitionHistory[], number>({
      query: (instanceId) => `/api/v2/workflow/${instanceId}/history`,
      transformResponse: (res: any) => res.data ?? res,
      providesTags: (_, __, instanceId) => [{ type: 'WorkflowHistory', id: instanceId }],
    }),
  }),
})

export const {
  useGetWorkflowStateQuery,
  useExecuteActionMutation,
  useGetClarificationThreadsQuery,
  useRequestClarificationMutation,
  useRespondToClarificationMutation,
  useResolveThreadMutation,
  useGetWorkflowDashboardQuery,
  useGetPendingCountQuery,
  useGetWorkflowHistoryQuery,
} = workflowApi
