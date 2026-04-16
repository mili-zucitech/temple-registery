import { z } from 'zod'

// ── Request schemas ───────────────────────────────────────────────────────────

export const createContractorSchema = z.object({
  name: z.string().min(1, 'Contractor name is required').max(255),
  gstNumber: z.string().max(30).optional(),
  serviceType: z.string().max(255).optional(),
  contractReference: z.string().max(100).optional(),
  workOrderDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractValue: z.number().nonnegative().optional(),
  paymentStatus: z.string().max(50).optional(),
  documentId: z.number().optional(),
})

export type CreateContractorRequest = z.infer<typeof createContractorSchema>
export type UpdateContractorRequest = Partial<CreateContractorRequest>

// ── Response types ────────────────────────────────────────────────────────────

export interface ContractorResponse {
  id: number
  templeId: number
  name: string
  gstNumber?: string
  serviceType?: string
  contractReference?: string
  workOrderDate?: string
  contractStartDate?: string
  contractEndDate?: string
  contractValue?: number
  paymentStatus?: string
}
