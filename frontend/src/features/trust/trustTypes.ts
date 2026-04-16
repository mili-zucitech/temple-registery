import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const TRUST_TYPES = ['SINGLE_TRUSTEE', 'MULTI_TRUSTEE', 'ENDOWMENT', 'DEVASWOM', 'OTHER'] as const
export type TrustType = (typeof TRUST_TYPES)[number]

// ── Request schemas ───────────────────────────────────────────────────────────

export const createTrustSchema = z.object({
  trustName: z.string().min(1, 'Trust name is required').max(255),
  trustType: z.enum(TRUST_TYPES),
  registrationNumber: z.string().min(1, 'Registration number is required').max(100),
  registeringAuthority: z.string().max(255).optional(),
  dateOfRegistration: z.string({ required_error: 'Date of registration is required' }),
  panNumber: z.string().max(20).optional(),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().max(255).optional(),
  bankBranch: z.string().max(255).optional(),
  annualIncome: z.number().nonnegative().optional(),
})

export const createBoardMemberSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits').optional(),
  designation: z.string().max(150).optional(),
  appointmentDate: z.string().optional(),
  tenureEndDate: z.string().optional(),
  contactNumber: z.string().max(15).optional(),
  address: z.string().optional(),
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
export type CreateBoardMemberRequest = z.infer<typeof createBoardMemberSchema>
export type UpdateBoardMemberRequest = z.infer<typeof updateBoardMemberSchema>
export type SubmitTrustFinancialRequest = z.infer<typeof submitTrustFinancialSchema>
export type CreateBoardMeetingRequest = z.infer<typeof createBoardMeetingSchema>

// ── Response types ────────────────────────────────────────────────────────────

export interface TrustResponse {
  id: number
  templeId: number
  trustName: string
  trustType: TrustType
  registrationNumber?: string
  registeringAuthority?: string
  dateOfRegistration?: string
  bankName?: string
  bankBranch?: string
  annualIncome?: number
}

export interface BoardMemberResponse {
  id: number
  trustId: number
  fullName: string
  aadhaarMasked?: string
  designation?: string
  appointmentDate?: string
  tenureEndDate?: string
  contactNumber?: string
  isCurrent: boolean
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
