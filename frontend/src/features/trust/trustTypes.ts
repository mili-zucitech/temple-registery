import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const TRUST_TYPES = ['PUBLIC', 'PRIVATE'] as const
export type TrustType = (typeof TRUST_TYPES)[number]

// ── Request schemas ───────────────────────────────────────────────────────────

export const createTrustSchema = z.object({
  trustName: z.string().min(1, 'Trust name is required'),
  trustRegistrationNumber: z.string().min(1, 'Registration number is required').regex(/^[a-zA-Z0-9]+$/, 'Must be alphanumeric'),
  dateOfRegistration: z.string().min(1, 'Date of registration is required'),
  registeringAuthority: z.string().min(1, 'Registering authority is required'),
  trustType: z.enum(TRUST_TYPES),
  trustPANNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  bankAccountNumber: z.string().regex(/^[0-9]{9,18}$/, 'Must be 9-18 digits'),
  bankNameAndBranch: z.string().min(1, 'Bank name and branch is required'),
  annualIncome: z.union([
    z.number().nonnegative('Must be zero or positive'),
    z.literal(''),
    z.undefined()
  ]),
})

export const createBoardMemberSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  aadhaar: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  designation: z.string().max(150),
  appointmentDate: z.string(),
  tenureEndDate: z.string().optional(),
  contactNumber: z.string().max(15),
  address: z.string(),
})

export const updateBoardMemberSchema = z.object({
  fullName: z.string().max(200).optional(),
  designation: z.string().max(150).optional(),
  appointmentDate: z.string().optional(),
  contactNumber: z.string().max(15).optional(),
  address: z.string().optional(),
  isCurrent: z.boolean().optional(),
  tenureEndDate: z.string().optional(),
})

export const submitTrustFinancialSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY').min(1, 'Financial year is required'),
  annualIncome: z.number().nonnegative().optional(),
  annualExpenditure: z.number().nonnegative().optional(),
  documentId: z.number().optional(),
})

export const createBoardMeetingSchema = z.object({
  meetingDate: z.string({ required_error: 'Meeting date is required' }),
  agenda: z.string().optional(),
  minutesDocumentId: z.number().optional(),
})

export type CreateTrustRequest = z.infer<typeof createTrustSchema>
export type UpdateTrustRequest = CreateTrustRequest
export type CreateBoardMemberRequest = z.infer<typeof createBoardMemberSchema>
export type UpdateBoardMemberRequest = z.infer<typeof updateBoardMemberSchema>
export type SubmitTrustFinancialRequest = z.infer<typeof submitTrustFinancialSchema>
export type CreateBoardMeetingRequest = z.infer<typeof createBoardMeetingSchema>

// ── Response types ────────────────────────────────────────────────────────────

export interface TrustResponse {
  id: number
  templeId: number
  trustName: string
  status: string
  isActive: boolean
  trustRegistrationNumber: string
  dateOfRegistration: string
  registeringAuthority: string
  trustType: string
  trustPANNumber: string
  bankAccountNumber: string
  bankNameAndBranch: string
  annualIncome?: number
  dissolvedAt?: string
  dissolutionReason?: string
  isVerifiedByDc: boolean
  dcFlagReason?: string
}

export interface BoardMemberResponse {
  id: number
  trustId: number
  fullName: string
  maskedAadhaar?: string
  designation: string
  appointmentDate: string
  tenureEndDate?: string
  contactNumber: string
  address: string
  isCurrent: boolean
  isVerifiedByDc: boolean
  dcFlagReason?: string
}

export interface TrustFinancialResponse {
  id: number
  trustId: number
  financialYear: string
  annualIncome?: number
  annualExpenditure?: number
  submittedAt?: string
  documentId?: number
}

export interface BoardMeetingResponse {
  id: number
  trustId: number
  meetingDate: string
  agenda?: string
  minutesDocumentId?: number
  createdAt: string
}
