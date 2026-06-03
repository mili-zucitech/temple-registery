import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'
import type { ApiResponse, PaginatedResponse, PageParams } from '@/types'

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TargetType = 'PAGE' | 'TAB' | 'SECTION' | 'BUTTON' | 'FIELD' | 'REPORT' | 'API_ENDPOINT' | 'KPI_CARD'
export type SubjectType = 'ROLE' | 'USER'
export type PolicyEffect = 'ALLOW' | 'DENY'
export type AuditChangeType = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE'

// ─── Request types ────────────────────────────────────────────────────────────

export interface CreatePolicyRequest {
  targetType: TargetType
  targetKey: string
  subjectType: SubjectType
  subjectValue: string
  effect: PolicyEffect
  active: boolean
  conditions?: string | null
}

export interface UpdatePolicyRequest {
  effect: PolicyEffect
  active: boolean
  conditions?: string | null
}

// ─── Response types ───────────────────────────────────────────────────────────

export interface PolicyResponse {
  id: number
  targetType: TargetType
  targetKey: string
  subjectType: SubjectType
  subjectValue: string
  effect: PolicyEffect
  active: boolean
  conditions?: string | null
  createdAt: string
  updatedAt: string
}

export interface FieldMaskResponse {
  id: number
  fieldKey: string
  subjectType: SubjectType
  subjectValue: string
  maskEnabled: boolean
  maskPattern: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface PolicyAuditLogResponse {
  id: number
  policyId?: number | null
  fieldMaskId?: number | null
  changedByUserId: number
  changeType: AuditChangeType
  oldValue?: string | null
  newValue?: string | null
  changedAt: string
  ipAddress?: string | null
}

export interface EffectivePermissionsResponse {
  permissions: Record<string, string>
  fieldMasks: Record<string, string>
}

export interface PolicyMatrixResponse {
  targetKeys: string[]
  roles: string[]
  matrix: Record<string, Record<string, string>>
}

export interface CreateFieldMaskRequest {
  fieldKey: string
  subjectType: SubjectType
  subjectValue: string
  maskEnabled: boolean
  maskPattern: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const accessControlApi = createApi({
  reducerPath: 'accessControlApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Policy', 'FieldMask', 'PolicyAudit', 'MyPermissions'],
  endpoints: (builder) => ({
    // ── Current user's effective permissions ──────────────────────────────────
    getMyPermissions: builder.query<ApiResponse<EffectivePermissionsResponse>, void>({
      query: () => ({ url: '/auth/me/permissions', method: 'GET' }),
      providesTags: ['MyPermissions'],
    }),

    // ── Policy CRUD ───────────────────────────────────────────────────────────
    listPolicies: builder.query<ApiResponse<PaginatedResponse<PolicyResponse>>, PageParams>({
      query: ({ page, size }) => ({ url: `/admin/access-control?page=${page}&size=${size}`, method: 'GET' }),
      providesTags: ['Policy'],
    }),

    createPolicy: builder.mutation<ApiResponse<PolicyResponse>, CreatePolicyRequest>({
      query: (body) => ({ url: '/admin/access-control', method: 'POST', body }),
      invalidatesTags: ['Policy', 'MyPermissions'],
    }),

    updatePolicy: builder.mutation<ApiResponse<PolicyResponse>, { id: number; body: UpdatePolicyRequest }>({
      query: ({ id, body }) => ({ url: `/admin/access-control/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Policy', 'MyPermissions'],
    }),

    deletePolicy: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/access-control/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Policy', 'MyPermissions'],
    }),

    batchUpsertPolicies: builder.mutation<ApiResponse<PolicyResponse[]>, CreatePolicyRequest[]>({
      query: (items) => ({ url: '/admin/access-control/batch', method: 'POST', body: { updates: items.map((policy) => ({ policy })) } }),
      invalidatesTags: ['Policy', 'MyPermissions'],
    }),

    // ── Matrix ────────────────────────────────────────────────────────────────
    getPolicyMatrix: builder.query<ApiResponse<PolicyMatrixResponse>, void>({
      query: () => ({ url: '/admin/access-control/matrix', method: 'GET' }),
      providesTags: ['Policy'],
    }),

    // ── Field masks ───────────────────────────────────────────────────────────
    listFieldMasks: builder.query<ApiResponse<PaginatedResponse<FieldMaskResponse>>, PageParams>({
      query: ({ page, size }) => ({ url: `/admin/access-control/field-masks?page=${page}&size=${size}`, method: 'GET' }),
      providesTags: ['FieldMask'],
    }),

    createFieldMask: builder.mutation<ApiResponse<FieldMaskResponse>, CreateFieldMaskRequest>({
      query: (body) => ({ url: '/admin/access-control/field-masks', method: 'POST', body }),
      invalidatesTags: ['FieldMask', 'MyPermissions'],
    }),

    deleteFieldMask: builder.mutation<ApiResponse<void>, number>({
      query: (id) => ({ url: `/admin/access-control/field-masks/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FieldMask', 'MyPermissions'],
    }),

    // ── Audit log ─────────────────────────────────────────────────────────────
    listPolicyAuditLog: builder.query<ApiResponse<PaginatedResponse<PolicyAuditLogResponse>>, PageParams>({
      query: ({ page, size }) => ({ url: `/admin/access-control/audit?page=${page}&size=${size}`, method: 'GET' }),
      providesTags: ['PolicyAudit'],
    }),
  }),
})

export const {
  useGetMyPermissionsQuery,
  useListPoliciesQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
  useBatchUpsertPoliciesMutation,
  useGetPolicyMatrixQuery,
  useListFieldMasksQuery,
  useCreateFieldMaskMutation,
  useDeleteFieldMaskMutation,
  useListPolicyAuditLogQuery,
} = accessControlApi
