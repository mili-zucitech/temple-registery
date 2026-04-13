import { z } from 'zod'
import type { TEMPLE_GRADES, RELIGIOUS_TRADITIONS } from '@/features/temple/templeTypes'

// ── Step 1 — Mobile + Aadhaar ─────────────────────────────────────────────────

export const step1Schema = z.object({
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
})

export type Step1Data = z.infer<typeof step1Schema>

// ── Step 2 — Aadhaar OTP Verify ───────────────────────────────────────────────

export const step2Schema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d{6}$/, 'OTP must contain only digits'),
})

export type Step2Data = z.infer<typeof step2Schema>

// ── Step 3 — Account Setup ────────────────────────────────────────────────────

export const step3Schema = z
  .object({
    fullName: z.string().min(2, 'Full name is required').max(200),
    username: z
      .string()
      .min(4, 'Username must be at least 4 characters')
      .max(64, 'Username must be at most 64 characters')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Only letters, numbers, dots, underscores, and hyphens allowed'),
    email: z.string().email('Enter a valid email address').max(255),
    password: z
      .string()
      .min(10, 'Password must be at least 10 characters')
      .max(128)
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one digit')
      .regex(/[!@#$%^&*()\-_=+\[\]{}]/, 'Must contain at least one special character (!@#$%^&*()_+-=[]{})'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type Step3Data = z.infer<typeof step3Schema>

// ── Step 4 — Temple Details ───────────────────────────────────────────────────

export const TEMPLE_GRADE_OPTIONS = ['A', 'B', 'C'] as const satisfies typeof TEMPLE_GRADES
export const TRADITION_OPTIONS = [
  'SHAIVITE', 'VAISHNAVITE', 'SHAKTA', 'JAIN', 'BUDDHIST', 'OTHER',
] as const satisfies typeof RELIGIOUS_TRADITIONS

export const step4Schema = z.object({
  templeName: z.string().min(2, 'Temple name is required').max(255),
  aliasName: z.string().max(255).optional(),
  deityName: z.string().min(1, 'Deity name is required').max(255),
  grade: z.enum(TEMPLE_GRADE_OPTIONS, { errorMap: () => ({ message: 'Select a temple grade' }) }),
  religiousTradition: z.enum(TRADITION_OPTIONS, { errorMap: () => ({ message: 'Select a religious tradition' }) }),
  hobliId: z.number({ required_error: 'Please select a Hobli' }),
  addressLine1: z.string().min(1, 'Address is required').max(255),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  gpsLatitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .nullable(),
  gpsLongitude: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .nullable(),
})

export type Step4Data = z.infer<typeof step4Schema>

// ── API Request Payloads ──────────────────────────────────────────────────────

export interface RegisterInitRequest {
  /** Backend field name is `aadhaar` (not aadhaarNumber) */
  aadhaar: string
  mobile: string
}

export interface RegisterInitResponse {
  /** Init session token — must be sent back in verify-aadhaar call */
  tempToken: string
  maskedAadhaar: string
  /** dev mode only */
  devOtp?: string
}

export interface VerifyAadhaarRequest {
  /** Backend field name is `aadhaar` */
  aadhaar: string
  otp: string
  /** Init session token received from register/init */
  tempToken: string
}

export interface VerifyAadhaarResponse {
  /** Backend field: `verificationToken` — the AADHAAR_VERIFIED token sent to /register/create */
  verificationToken: string
  message: string
}

export interface TempleRegistrationFields {
  name: string
  aliasName?: string
  deityName?: string
  grade: 'A' | 'B' | 'C'
  religiousTradition: string
  hobliId: number
  addressLine1: string
  pincode: string
  gpsLatitude?: number | null
  gpsLongitude?: number | null
}

export interface CreateAccountRequest {
  tempToken: string
  username: string
  email: string
  password: string
  fullName: string
  mobile: string
  temple: TempleRegistrationFields
}

export interface CreateAccountResponse {
  userId: number
}

export interface MfaSetupRequest {
  userId: number
  phone: string
}

export interface MfaSetupVerifyRequest {
  userId: number
  otp: string
}

export interface MfaSetupVerifyResponse {
  message: string
  userId: number
  recoveryCodes: string[]
}

// ── Wizard State ──────────────────────────────────────────────────────────────

export interface WizardState {
  currentStep: number
  step1: Step1Data | null
  step2: { otp: string } | null
  /** Session token from POST /register/init — sent in verify-aadhaar call */
  initToken: string | null
  /** AADHAAR_VERIFIED token from POST /register/verify-aadhaar — sent in /register/create */
  tempToken: string | null
  step3: Omit<Step3Data, 'confirmPassword'> | null
  step4: Step4Data | null
  userId: number | null
  recoveryCodes: string[]
}

export const WIZARD_STEPS = [
  { id: 1, label: 'Identity' },
  { id: 2, label: 'OTP Verify' },
  { id: 3, label: 'Account' },
  { id: 4, label: 'Temple' },
  { id: 5, label: 'Review' },
  { id: 6, label: 'MFA Setup' },
  { id: 7, label: 'Recovery' },
  { id: 8, label: 'Done' },
] as const
