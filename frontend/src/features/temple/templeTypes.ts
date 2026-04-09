import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const TEMPLE_GRADES = ['A', 'B', 'C'] as const
export type TempleGrade = (typeof TEMPLE_GRADES)[number]

export const RELIGIOUS_TRADITIONS = [
  'SHAIVITE', 'VAISHNAVITE', 'SHAKTA', 'JAIN', 'BUDDHIST', 'OTHER',
] as const
export type ReligiousTradition = (typeof RELIGIOUS_TRADITIONS)[number]

// ── Request schemas ───────────────────────────────────────────────────────────

export const createTempleSchema = z.object({
  name: z.string().min(1, 'Temple name is required').max(255),
  grade: z.enum(TEMPLE_GRADES),
  tradition: z.enum(RELIGIOUS_TRADITIONS),
  districtId: z.number({ required_error: 'District is required' }),
  talukId: z.number().optional(),
  hobliId: z.number().optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(128).optional(),
  pinCode: z.string().length(6).regex(/^\d{6}$/).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  contactName: z.string().max(128).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().max(15).optional(),
  trustRegistered: z.boolean().default(false),
})

export const templeSearchFilterSchema = z.object({
  name: z.string().optional(),
  grade: z.enum(TEMPLE_GRADES).optional(),
  tradition: z.enum(RELIGIOUS_TRADITIONS).optional(),
  districtId: z.number().optional(),
  talukId: z.number().optional(),
  hobliId: z.number().optional(),
  trustRegistered: z.boolean().optional(),
  assetDeclarationStatus: z.string().optional(),
})

export type CreateTempleRequest = z.infer<typeof createTempleSchema>
export type TempleSearchFilterRequest = z.infer<typeof templeSearchFilterSchema>

// ── Response types ────────────────────────────────────────────────────────────

export interface TempleResponse {
  id: number
  name: string
  grade: TempleGrade
  tradition: ReligiousTradition
  districtId: number
  talukId?: number
  hobliId?: number
  addressLine1?: string
  city?: string
  pinCode?: string
  latitude?: number
  longitude?: number
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  trustRegistered: boolean
  assetDeclarationStatus?: string
  createdAt: string
  updatedAt: string
}

export interface TempleSearchResultResponse {
  id: number
  templeId: number
  name: string
  grade: TempleGrade
  tradition: ReligiousTradition
  districtId?: number
  districtName?: string
  city?: string
  trustRegistered: boolean
  declarationStatus?: string
  latitude?: number
  longitude?: number
}

// ── Temple Profile Staging ────────────────────────────────────────────────────

export type TempleProfileStagingStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED'

export const createTempleProfileStagingSchema = z.object({
  contactPersonName: z.string().max(255).optional(),
  contactPersonDesignation: z.string().max(100).optional(),
  photoFilePath: z.string().max(1000).optional(),
  bankAccountNumber: z.string().optional(),
  languagesOfWorship: z.string().max(500).optional(),
  linkedInstitutions: z.string().optional(),
  annualFestivals: z.string().optional(),
  landmark: z.string().optional(),
  historicalSignificance: z.string().optional(),
})

export type CreateTempleProfileStagingRequest = z.infer<typeof createTempleProfileStagingSchema>

export interface TempleProfileStagingResponse {
  id: number
  templeId: number
  versionNumber: number
  statusLabel: TempleProfileStagingStatus
  contactPersonName?: string
  contactPersonDesignation?: string
  photoFilePath?: string
  bankAccountMasked?: string
  languagesOfWorship?: string
  linkedInstitutions?: string
  annualFestivals?: string
  landmark?: string
  historicalSignificance?: string
  reviewComment?: string
  submittedAt?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}
