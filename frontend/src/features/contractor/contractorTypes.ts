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

// ── Validation helpers ────────────────────────────────────────────────────────

const companyNameRegex = /^[a-zA-Z0-9\s.&'(),-]+$/
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
const contractRefRegex = /^[a-zA-Z0-9\s/-]+$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

// ── Request schemas ───────────────────────────────────────────────────────────

export const createContractorSchema = z.object({
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must not exceed 255 characters')
    .regex(companyNameRegex, 'Company name can only contain letters, numbers, spaces and common punctuation (. & \' ( ) , -)')
    .refine((val) => val.trim().length >= 2, 'Company name cannot be just spaces'),
  
  gstNumber: z.string()
    .regex(gstRegex, 'GST number must be in valid format (e.g., 22AAAAA0000A1Z5)')
    .length(15, 'GST number must be exactly 15 characters')
    .optional()
    .or(z.literal('')),
  
  serviceType: z.nativeEnum(ServiceType, { 
    required_error: 'Service type is required',
    invalid_type_error: 'Please select a valid service type'
  }),
  
  contractReference: z.string()
    .min(1, 'Contract reference is required')
    .max(100, 'Contract reference must not exceed 100 characters')
    .regex(contractRefRegex, 'Contract reference can only contain letters, numbers, spaces, hyphens and slashes'),
  
  workOrderDate: z.string()
    .regex(dateRegex, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  
  contractStartDate: z.string()
    .min(1, 'Contract start date is required')
    .regex(dateRegex, 'Invalid date format'),
  
  contractEndDate: z.string()
    .regex(dateRegex, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  
  contractValue: z.number({
    required_error: 'Contract value is required',
    invalid_type_error: 'Contract value must be a number'
  })
    .nonnegative('Contract value cannot be negative')
    .min(0.01, 'Contract value must be greater than 0')
    .max(999999999.99, 'Contract value is too large'),
  
  paymentStatus: z.nativeEnum(PaymentStatus, { 
    required_error: 'Payment status is required',
    invalid_type_error: 'Please select a valid payment status'
  }),
  
  documentIds: z.array(z.number()).optional(),
}).refine((data) => {
  // If end date is provided, it must be after start date
  if (data.contractEndDate && data.contractStartDate) {
    const start = new Date(data.contractStartDate)
    const end = new Date(data.contractEndDate)
    return end >= start
  }
  return true
}, {
  message: 'Contract end date must be on or after start date',
  path: ['contractEndDate'],
})

export const updateContractorSchema = z.object({
  companyName: z.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must not exceed 255 characters')
    .regex(companyNameRegex, 'Company name can only contain letters, numbers, spaces and common punctuation (. & \' ( ) , -)')
    .refine((val) => val.trim().length >= 2, 'Company name cannot be just spaces')
    .optional(),
  
  gstNumber: z.string()
    .regex(gstRegex, 'GST number must be in valid format (e.g., 22AAAAA0000A1Z5)')
    .length(15, 'GST number must be exactly 15 characters')
    .optional()
    .or(z.literal('')),
  
  serviceType: z.nativeEnum(ServiceType, { 
    invalid_type_error: 'Please select a valid service type'
  }).optional(),
  
  contractReference: z.string()
    .min(1, 'Contract reference is required')
    .max(100, 'Contract reference must not exceed 100 characters')
    .regex(contractRefRegex, 'Contract reference can only contain letters, numbers, spaces, hyphens and slashes')
    .optional(),
  
  workOrderDate: z.string()
    .regex(dateRegex, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  
  contractStartDate: z.string()
    .regex(dateRegex, 'Invalid date format')
    .optional(),
  
  contractEndDate: z.string()
    .regex(dateRegex, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  
  contractValue: z.number({
    invalid_type_error: 'Contract value must be a number'
  })
    .nonnegative('Contract value cannot be negative')
    .min(0.01, 'Contract value must be greater than 0')
    .max(999999999.99, 'Contract value is too large')
    .optional(),
  
  paymentStatus: z.nativeEnum(PaymentStatus, { 
    invalid_type_error: 'Please select a valid payment status'
  }).optional(),
  
  documentIds: z.array(z.number()).optional(),
}).refine((data) => {
  // If both dates are provided, end date must be after start date
  if (data.contractEndDate && data.contractStartDate) {
    const start = new Date(data.contractStartDate)
    const end = new Date(data.contractEndDate)
    return end >= start
  }
  return true
}, {
  message: 'Contract end date must be on or after start date',
  path: ['contractEndDate'],
})

export type CreateContractorRequest = z.infer<typeof createContractorSchema>
export type UpdateContractorRequest = z.infer<typeof updateContractorSchema>

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
