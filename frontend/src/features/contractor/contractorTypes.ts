import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum ServiceType {
  CIVIL_WORKS = 'CIVIL_WORKS',
  ELECTRICAL = 'ELECTRICAL',
  SECURITY = 'SECURITY',
  CATERING = 'CATERING',
  EVENTS = 'EVENTS',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  [ServiceType.CIVIL_WORKS]: 'Civil Works',
  [ServiceType.ELECTRICAL]: 'Electrical',
  [ServiceType.SECURITY]: 'Security',
  [ServiceType.CATERING]: 'Catering',
  [ServiceType.EVENTS]: 'Events',
  [ServiceType.OTHER]: 'Other',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Pending',
  [PaymentStatus.COMPLETED]: 'Completed',
  [PaymentStatus.DISPUTED]: 'Disputed',
}

// ── Request schemas ───────────────────────────────────────────────────────────

export const createContractorSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(255),
  gstNumber: z.string().max(30).optional(),
  serviceType: z.nativeEnum(ServiceType, { required_error: 'Service type is required' }),
  contractReference: z.string().max(100).optional(),
  workOrderDate: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractValue: z.number().nonnegative().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus, { required_error: 'Payment status is required' }),
  documentIds: z.array(z.number()).optional(),
})

export type CreateContractorRequest = z.infer<typeof createContractorSchema>
export type UpdateContractorRequest = Partial<CreateContractorRequest>

// ── Response types ────────────────────────────────────────────────────────────

export interface ContractorResponse {
  id: number
  templeId: number
  companyName: string
  gstNumber?: string
  serviceType: ServiceType
  contractReference?: string
  workOrderDate?: string
  contractStartDate?: string
  contractEndDate?: string
  contractValue?: number
  paymentStatus: PaymentStatus
  documentIds?: number[]
  isVerifiedByDc?: boolean
  dcFlagReason?: string
}
