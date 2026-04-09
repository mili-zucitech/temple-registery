import { z } from 'zod'

export const DECLARATION_STATUSES = [
  'DRAFT', 'SUBMITTED', 'CLARIFICATION_REQUESTED',
  'PHYSICAL_VERIFICATION_REQUESTED', 'APPROVED', 'REJECTED',
] as const
export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number]

export const createDeclarationSchema = z.object({
  agriculturalLandAcres: z.number().nonnegative().optional(),
  agriculturalLandValue: z.number().nonnegative().optional(),
  buildingsSqft: z.number().nonnegative().optional(),
  buildingsValue: z.number().nonnegative().optional(),
  leasedPropertiesCount: z.number().int().nonnegative().optional(),
  leasedPropertiesValue: z.number().nonnegative().optional(),
  otherLandValue: z.number().nonnegative().optional(),
  goldGrams: z.number().nonnegative().optional(),
  silverGrams: z.number().nonnegative().optional(),
  idolsCount: z.number().int().nonnegative().optional(),
  vehiclesCount: z.number().int().nonnegative().optional(),
  financialAssetsValue: z.number().nonnegative().optional(),
  otherMovableValue: z.number().nonnegative().optional(),
  dueDate: z.string().optional(),
})

export const clarificationSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
})

export type CreateDeclarationRequest = z.infer<typeof createDeclarationSchema>
export type ClarificationRequest = z.infer<typeof clarificationSchema>

export interface DeclarationResponse {
  id: number; templeId: number; templeName?: string; districtId: number; status: DeclarationStatus
  agriculturalLandAcres?: number; agriculturalLandValue?: number
  buildingsSqft?: number; buildingsValue?: number
  goldGrams?: number; silverGrams?: number; idolsCount?: number; vehiclesCount?: number
  financialAssetsValue?: number; otherMovableValue?: number
  submittedAt?: string; reviewedAt?: string; acknowledgementNumber?: string; dueDate?: string
}

export interface ClarificationThreadItem {
  id: number; direction: 'DC_TO_TEMPLE' | 'TEMPLE_TO_DC'; message: string
  authorId: number; createdAt: string
}

export interface AcknowledgementResponse {
  acknowledgementNumber: string; downloadUrl: string; generatedAt: string
}
