import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryV2WithReauth } from '../../services/baseQueryV2WithReauth'
import type { WorkflowEnvelope } from '../../types/workflow'
import type { TrustResponse } from '../trust/trustTypes'
import type { CompleteDeclarationResponse } from '../declaration/declarationTypes'
import type { TempleProfileStagingResponse } from '../temple-profile/hooks/templeTypes'

/**
 * [P5] GovernanceV2Api
 * 
 * Consumes the authoritative WorkflowEnvelope endpoints.
 * Replaces separate calls to module APIs + workflow status APIs.
 */
export const governanceV2Api = createApi({
  reducerPath: 'governanceV2Api',
  baseQuery: baseQueryV2WithReauth,
  tagTypes: ['DeclarationV2', 'TrustV2', 'StagingV2'],
  endpoints: (builder) => ({

    getDeclarationV2: builder.query<WorkflowEnvelope<CompleteDeclarationResponse>, number>({
      query: (id) => `/api/v2/declarations/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'DeclarationV2', id }],
    }),

    getTrustV2: builder.query<WorkflowEnvelope<TrustResponse>, number>({
      query: (id) => `/api/v2/trusts/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'TrustV2', id }],
    }),

    getStagingV2: builder.query<WorkflowEnvelope<TempleProfileStagingResponse>, number>({
      query: (id) => `/api/v2/temple-profile-staging/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'StagingV2', id }],
    }),

  }),
})

export const {
  useGetDeclarationV2Query,
  useGetTrustV2Query,
  useGetStagingV2Query,
} = governanceV2Api
