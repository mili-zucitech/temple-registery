import { z } from 'zod'
import type { UserRole } from '@/constants/roles'

// ── Zod schemas ──────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const mfaVerifySchema = z.object({
  tempToken: z.string().min(1),
  mfaCode: z.string().length(6, 'OTP must be 6 digits').optional().nullable(),
})

export const aadhaarOtpRequestSchema = z.object({
  aadhaarNumber: z
    .string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar must contain only digits'),
})

export const aadhaarOtpVerifySchema = z.object({
  aadhaarNumber: z.string().length(12),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const registerSchema = z
  .object({
    username: z.string().min(3).max(64),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
    fullName: z.string().min(1).max(128),
    mobile: z.string().regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number'),
    aadhaarVerificationToken: z.string().min(1, 'Aadhaar verification required'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ── Inferred TypeScript types ─────────────────────────────────────────────────

export type LoginRequest = z.infer<typeof loginSchema>
export type MfaVerifyRequest = z.infer<typeof mfaVerifySchema>
export type AadhaarOtpRequest = z.infer<typeof aadhaarOtpRequestSchema>
export type AadhaarOtpVerifyRequest = z.infer<typeof aadhaarOtpVerifySchema>
export type RegisterRequest = z.infer<typeof registerSchema>
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetConfirmRequest = z.infer<typeof passwordResetConfirmSchema>

// ── Response types ────────────────────────────────────────────────────────────

export interface AuthTokenResponse {
  accessToken: string
  expiresIn: number
  role: string
  userId: number
}

export interface MfaChallengeResponse {
  mfaRequired: boolean
  tempToken: string
  challengeType: 'TOTP' | 'SMS_OTP'
  mfaRequired: boolean
  mfaType: 'TOTP' | 'SMS'
  maskedMobile?: string
}

export interface AadhaarOtpResponse {
  verificationToken: string
  maskedAadhaar: string
}

export interface CurrentUser {
  userId: number
  username: string
  fullName: string
  role: UserRole
  districtId?: number
  templeId?: number
  aadhaarVerified: boolean
  completionChecklist?: TempleCompletionChecklist
}

export interface TempleCompletionChecklist {
  templeProfileStatus: string | null
  trustExists: boolean
  employeeCount: number
  contractorCount: number
  latestDeclarationStatus: string | null
}
