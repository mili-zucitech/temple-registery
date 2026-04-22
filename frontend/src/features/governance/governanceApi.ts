import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse } from '@/types'
import type {
  SendBackRequest,
  RejectRequest,
  OrderPhysicalVerificationRequest,
  UpdatePhysicalVerificationRequest,
  PhysicalVerificationHistoryEntry,
  WorkflowApproveRequest,
  WorkflowRejectRequest,
  DcClarifyRequest,
  WorkflowActionResponse,
} from './governanceTypes'

/**
 * RTK Query API for governance workflow actions — SINGLE SOURCE OF TRUTH.
 *
 * Modules with DC approval: TRUST and ASSET DECLARATION only.
 * Staff (Employee) and Contractors do NOT have DC approval.
 * Changes to those modules are effective immediately on save.
 *
 * ENDPOINT RULES:
 * - Submit: Temple Authority only
 * - Approve / Send Back / Reject / Clarify / Under-Review / Flag-Physical: District Collector only
 * - Physical verification: District Collector only
 * - Physical verification history: DC + DC Staff (read-only)
 */
export const governanceApi = createApi({
  reducerPath: 'governanceApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'GovernanceTrust',
    'GovernanceDeclaration',
    'PhysicalVerificationHistory',
  ],
  endpoints: (builder) => ({
    // ─── TRUST ───────────────────────────────────────────────────────────────

    submitTrust: builder.mutation<ApiResponse<void>, number>({
      query: (trustId) => ({ url: `/governance/trusts/${trustId}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, trustId) => [{ type: 'GovernanceTrust', id: trustId }],
    }),

    approveTrust: builder.mutation<ApiResponse<void>, number>({
      query: (trustId) => ({ url: `/governance/trusts/${trustId}/approve`, method: 'POST' }),
      invalidatesTags: (_r, _e, trustId) => [{ type: 'GovernanceTrust', id: trustId }],
    }),

    sendBackTrust: builder.mutation<ApiResponse<void>, { trustId: number; body: SendBackRequest }>({
      query: ({ trustId, body }) => ({
        url: `/governance/trusts/${trustId}/send-back`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'GovernanceTrust', id: trustId }],
    }),

    rejectTrust: builder.mutation<ApiResponse<void>, { trustId: number; body: RejectRequest }>({
      query: ({ trustId, body }) => ({
        url: `/governance/trusts/${trustId}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { trustId }) => [{ type: 'GovernanceTrust', id: trustId }],
    }),

    // ─── DECLARATION ──────────────────────────────────────────────────────────

    submitDeclaration: builder.mutation<ApiResponse<void>, number>({
      query: (declarationId) => ({ url: `/governance/declarations/${declarationId}/submit`, method: 'POST' }),
      invalidatesTags: (_r, _e, declarationId) => [{ type: 'GovernanceDeclaration', id: declarationId }],
    }),

    approveDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; templeId?: number; body?: WorkflowApproveRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/governance/declarations/${id}/approve`,
        method: 'POST',
        body: body ?? {},
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id, templeId }) => [
        { type: 'GovernanceDeclaration', id },
        'PhysicalVerificationHistory',
      ],
    }),

    sendBackDeclaration: builder.mutation<ApiResponse<void>, { declarationId: number; body: SendBackRequest }>({
      query: ({ declarationId, body }) => ({
        url: `/governance/declarations/${declarationId}/send-back`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { declarationId }) => [{ type: 'GovernanceDeclaration', id: declarationId }],
    }),

    rejectDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; templeId?: number; body: WorkflowRejectRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/governance/declarations/${id}/reject`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'GovernanceDeclaration', id }],
    }),

    clarifyDeclaration: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; templeId?: number; body: DcClarifyRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/governance/declarations/${id}/clarify`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'GovernanceDeclaration', id }],
    }),

    markUnderReviewDeclaration: builder.mutation<ApiResponse<WorkflowActionResponse>, number>({
      query: (id) => ({
        url: `/governance/declarations/${id}/under-review`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, id) => [{ type: 'GovernanceDeclaration', id }],
    }),

    flagPhysicalVerification: builder.mutation<
      ApiResponse<WorkflowActionResponse>,
      { id: number; templeId?: number; body: DcClarifyRequest; idempotencyKey?: string }
    >({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/governance/declarations/${id}/flag-physical`,
        method: 'POST',
        body,
        headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'GovernanceDeclaration', id }],
    }),

    // ─── PHYSICAL VERIFICATION (DC-only) ─────────────────────────────────────

    orderPhysicalVerification: builder.mutation<
      ApiResponse<void>,
      { declarationId: number; body: OrderPhysicalVerificationRequest }
    >({
      query: ({ declarationId, body }) => ({
        url: `/governance/declarations/${declarationId}/physical-verification/order`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { declarationId }) => [
        { type: 'GovernanceDeclaration', id: declarationId },
        { type: 'PhysicalVerificationHistory', id: declarationId },
      ],
    }),

    updatePhysicalVerification: builder.mutation<
      ApiResponse<void>,
      { declarationId: number; body: UpdatePhysicalVerificationRequest }
    >({
      query: ({ declarationId, body }) => ({
        url: `/governance/declarations/${declarationId}/physical-verification/update`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { declarationId }) => [
        { type: 'GovernanceDeclaration', id: declarationId },
        { type: 'PhysicalVerificationHistory', id: declarationId },
      ],
    }),

    /**
     * Get physical verification history — DC-only.
     * MUST NOT be called from any Temple Authority screen.
     */
    getPhysicalVerificationHistory: builder.query<
      ApiResponse<PhysicalVerificationHistoryEntry[]>,
      number
    >({
      query: (declarationId) =>
        `/governance/declarations/${declarationId}/physical-verification/history`,
      providesTags: (_r, _e, declarationId) => [
        { type: 'PhysicalVerificationHistory', id: declarationId },
      ],
    }),
  }),
})

export const {
  // Trust
  useSubmitTrustMutation,
  useApproveTrustMutation,
  useSendBackTrustMutation,
  useRejectTrustMutation,
  // Declaration
  useSubmitDeclarationMutation,
  useApproveDeclarationMutation,
  useSendBackDeclarationMutation,
  useRejectDeclarationMutation,
  useClarifyDeclarationMutation,
  useMarkUnderReviewDeclarationMutation,
  useFlagPhysicalVerificationMutation,
  // Physical Verification (DC-only)
  useOrderPhysicalVerificationMutation,
  useUpdatePhysicalVerificationMutation,
  useGetPhysicalVerificationHistoryQuery,
} = governanceApi
