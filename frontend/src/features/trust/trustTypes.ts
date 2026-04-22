import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const TRUST_TYPES = ['SINGLE_TRUSTEE', 'MULTI_TRUSTEE', 'ENDOWMENT', 'DEVASWOM', 'OTHER'] as const
export type TrustType = (typeof TRUST_TYPES)[number]

// ── Request schemas ───────────────────────────────────────────────────────────

const today = new Date().toISOString().slice(0, 10)

export const createTrustSchema = z.object({
  trustName: z.string().min(1, 'Trust name is required').max(255),
  trustType: z.enum(TRUST_TYPES),
  registrationNumber: z.string().min(1, 'Registration number is required').max(100).regex(/^[A-Za-z0-9/-]+$/, 'Must be alphanumeric'),
  registeringAuthority: z.string().min(1, 'Registering authority is required').max(255),
  dateOfRegistration: z.string({ required_error: 'Date of registration is required' }).refine((value) => value <= today, 'Date cannot be in the future'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
  bankAccountNumber: z.string().regex(/^\d{6,32}$/, 'Bank account must be numeric'),
  bankName: z.string().min(1, 'Bank name is required').max(255),
  bankBranch: z.string().min(1, 'Bank branch is required').max(255),
  annualIncome: z.number().nonnegative().nullable().optional(),
})

export const createBoardMemberSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  designation: z.string().min(1, 'Designation is required').max(150),
  appointmentDate: z.string().min(1, 'Appointment date is required').refine((value) => value <= today, 'Appointment date cannot be in the future'),
  tenureEndDate: z.string().optional(),
  contactNumber: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  address: z.string().min(1, 'Address is required'),
}).refine((value) => !value.tenureEndDate || value.tenureEndDate > value.appointmentDate, {
  message: 'Tenure end date must be after appointment date',
  path: ['tenureEndDate'],
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
  annualIncome: z.number().nonnegative().nullable().optional(),
  annualExpenditure: z.number().nonnegative().nullable().optional(),
  documentId: z.number().optional(),
}).refine((value) => value.annualIncome != null || value.annualExpenditure != null || value.documentId != null, {
  message: 'Provide at least one financial value or a supporting document',
  path: ['annualIncome'],
})

export const createBoardMeetingSchema = z.object({
  meetingDate: z.string({ required_error: 'Meeting date is required' }).refine((value) => value <= today, 'Meeting date cannot be in the future'),
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
  registrationNumber: string
  registeringAuthority: string
  dateOfRegistration: string
  /** Always masked (e.g. AB*****4F). Raw PAN is never returned by the API. */
  maskedPanNumber?: string
  /** Always masked (e.g. ******1234). Raw account number is never returned by the API. */
  maskedBankAccountNumber?: string
  bankName?: string
  bankBranch?: string
  annualIncome?: number | null
  status?: string
  isVerifiedByDc?: boolean
  dcFlagReason?: string | null
}

export interface BoardMemberResponse {
  id: number
  trustId: number
  fullName: string
  maskedAadhaar?: string | null
  designation?: string
  appointmentDate?: string
  tenureEndDate?: string | null
  contactNumber?: string
  address?: string
  isCurrent: boolean
  isVerifiedByDc?: boolean
  dcFlagReason?: string | null
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

export interface BoardMemberGroupResponse {
  current: BoardMemberResponse[]
  past: BoardMemberResponse[]
}
