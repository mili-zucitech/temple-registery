import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/services/baseQueryWithReauth'

export const exportApi = createApi({
  reducerPath: 'exportApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    exportTemples: builder.mutation<Blob, { districtId?: number; grade?: string; format: string }>({
      query: (body) => ({
        url: '/export/temples',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),
    exportDeclarations: builder.mutation<Blob, { districtId?: number; status?: string; format: string }>({
      query: (body) => ({
        url: '/export/declarations',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),
    downloadEvidencePack: builder.query<Blob, number>({
      query: (templeId) => ({
        url: `/export/evidence-pack/${templeId}`,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useExportTemplesMutation,
  useExportDeclarationsMutation,
  useDownloadEvidencePackQuery,
} = exportApi
