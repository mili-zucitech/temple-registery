import { z } from 'zod'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const DC_ROLES = ['DISTRICT_COLLECTOR', 'DC_STAFF', 'SUPER_ADMIN'] as const
export type DcRole = (typeof DC_ROLES)[number]

export const DECLARATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'CLARIFICATION_REQUESTED',
  'PHYSICAL_VERIFICATION_REQUESTED',
  'OVERDUE',
] as const
export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number]

export const EXPORT_FORMATS = ['CSV', 'PDF'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

// ─── Request schemas ─────────────────────────────────────────────────────────

export const dcTempleSearchFilterSchema = z.object({
  districtId: z.number().optional(),
  talukId: z.number().optional(),
  hobliId: z.number().optional(),
  grade: z.array(z.string()).optional(),
  keyword: z.string().optional(),
  deityName: z.string().optional(),
  tradition: z.string().optional(),
  trustRegistered: z.boolean().optional(),
  declarationStatus: z.string().optional(),
  establishedYearFrom: z.number().optional(),
  establishedYearTo: z.number().optional(),
  page: z.number().default(0),
  size: z.number().default(10),
  sort: z.string().optional(),
})

export const workflowApproveSchema = z.object({
  notes: z.string().max(1000).optional(),
})

export const workflowRejectSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
})

export const dcClarifySchema = z.object({
  notes: z.string().min(1, 'Notes are required').max(2000),
})

export const approveProfileSchema = z.object({
  notes: z.string().max(1000).optional(),
})

export const rejectProfileSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
})

export const exportTemplesSchema = z.object({
  districtId: z.number().optional(),
  grade: z.string().optional(),
  tradition: z.string().optional(),
  trustRegistered: z.boolean().optional(),
  format: z.enum(EXPORT_FORMATS),
})

export const exportDeclarationsSchema = z.object({
  districtId: z.number().optional(),
  financialYear: z.string().optional(),
  status: z.string().optional(),
  format: z.enum(EXPORT_FORMATS),
})

export type DcTempleSearchFilterRequest = z.infer<typeof dcTempleSearchFilterSchema>
export type WorkflowApproveRequest = z.infer<typeof workflowApproveSchema>
export type WorkflowRejectRequest = z.infer<typeof workflowRejectSchema>
export type DcClarifyRequest = z.infer<typeof dcClarifySchema>
export type ApproveProfileRequest = z.infer<typeof approveProfileSchema>
export type RejectProfileRequest = z.infer<typeof rejectProfileSchema>
export type ExportTemplesRequest = z.infer<typeof exportTemplesSchema>
export type ExportDeclarationsRequest = z.infer<typeof exportDeclarationsSchema>

// ─── Response types ───────────────────────────────────────────────────────────

export interface GradeDistributionItem {
  grade: string
  count: number
}

export interface DcContextResponse {
  userId: number
  username: string
  role: DcRole
  districtId: number | null
  districtName: string | null
}

export interface DcDashboardResponse {
  totalTemples: number
  pendingDeclarations: number
  overdueDeclarations: number
  pendingProfileReviews: number
  templesWithoutApprovedDeclaration: number
  gradeDistribution: GradeDistributionItem[]
}

export interface DcTempleSearchItemResponse {
  templeId: number
  registrationNumber: string | null
  name: string
  grade: string
  primaryDeity: string | null
  tradition: string
  hobliId: number | null
  talukId: number | null
  districtId: number | null
  cityId: number | null
  templeStatus: string
  trustRegistered: boolean
  assetDeclarationStatus: string | null
  yearEstablished: number | null
  photoUrl: string | null
  pendingDeclarations: number
  overdueDeclarations: number
  pendingProfileReview: number
  hasActiveTrust: boolean
  hasApprovedDeclaration: boolean
  lastDeclarationAt: string | null
  lastProfileUpdateAt: string | null
}

export interface WorkflowActionResponse {
  declarationId: number
  newStatus: string
  acknowledgementNumber: string | null
  message: string
}

export interface ClarificationItemResponse {
  id: number
  direction: string
  notes: string
  respondedAt: string | null
  createdAt: string
}

export interface DeclImmovAgriLandResponse {
  id: number
  surveyNumber: string
  villageName: string
  areaAcres: number
  estimatedValueInr: number
}

export interface DeclImmovBuildingResponse {
  id: number
  buildingName: string
  totalSqft: number
  estimatedValueInr: number
}

export interface DeclImmovLeasedResponse {
  id: number
  lesseeOrLandlordName: string
  monthlyRent: number
}

export interface DeclImmovOtherResponse {
  id: number
  description: string
  estimatedValueInr: number
}

export interface DeclMovArtifactResponse {
  id: number
  artifactName: string
  material: string
  estimatedValueInr: number
}

export interface DeclMovEquipmentResponse {
  id: number
  equipmentName: string
  quantity: number
  estimatedValueInr: number
}

export interface DeclMovPreciousMetalResponse {
  id: number
  metalType: string
  weightGrams: number
  estimatedValueInr: number
}

export interface DeclMovVehicleResponse {
  id: number
  vehicleType: string
  registrationNumber: string
  estimatedValueInr: number
}

export interface DeclarationDetailResponse {
  id: number
  templeId: number
  districtId: number
  financialYear: string
  versionNumber: number
  status: DeclarationStatus
  agriculturalLandAcres: number | null
  agriculturalLandValue: number | null
  buildingsSqft: number | null
  buildingsValue: number | null
  leasedPropertiesCount: number | null
  leasedPropertiesValue: number | null
  otherLandValue: number | null
  goldGrams: number | null
  silverGrams: number | null
  idolsCount: number | null
  vehiclesCount: number | null
  financialAssetsValue: number | null
  otherMovableValue: number | null
  submittedAt: string | null
  reviewedAt: string | null
  acknowledgementNumber: string | null
  dueDate: string | null
  clarificationRound: number
  overdue: boolean
  clarifications: ClarificationItemResponse[]
  agricultureLands: DeclImmovAgriLandResponse[]
  buildings: DeclImmovBuildingResponse[]
  leasedProperties: DeclImmovLeasedResponse[]
  otherLands: DeclImmovOtherResponse[]
  artifacts: DeclMovArtifactResponse[]
  equipment: DeclMovEquipmentResponse[]
  preciousMetals: DeclMovPreciousMetalResponse[]
  vehicles: DeclMovVehicleResponse[]
}

export interface DcTrustSummary {
  id: number
  trustName: string
  status: string | null
  registrationNumber: string | null
  registrationDate: string | null
  panNumberMasked: string | null
}

export interface TrustFinancialSummary {
  financialYear: string
  annualIncome: number | null
  expenditure: number | null
}

export interface ProfileCurrentResponse {
  id: number
  templeId: number
  approvedAt: string
  approvedByUserId: number
  contentSnapshot: string
}

/** Shape mirrors backend TempleFullProfileResponse */
export interface TempleFullProfileResponse {
  temple: {
    id: number
    name: string
    grade: string
    tradition: string
    districtId: number
    talukId: number | null
    hobliId: number | null
    addressLine1: string | null
    city: string | null
    pinCode: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    trustRegistered: boolean
    assetDeclarationStatus: string | null
    createdAt: string
    updatedAt: string
  }
  hobliName: string | null
  talukName: string | null
  districtName: string | null
  cityName: string | null
  trust: DcTrustSummary | null
  boardMembers: BoardMemberSummary[]
  trustFinancials: TrustFinancialSummary[]
  employees: EmployeeSummary[]
  contractors: ContractorSummary[]
  declarations: DeclarationSummary[]
  currentProfile: ProfileCurrentResponse | null
}

export interface BoardMemberSummary {
  id: number
  name: string
  role: string
  phone: string | null
  email: string | null
  aadhaarMasked: string | null
}

export interface EmployeeSummary {
  id: number
  name: string
  designation: string
  employmentType: string
  joiningDate: string | null
}

export interface ContractorSummary {
  id: number
  contractorName: string
  serviceType: string
  contractStartDate: string | null
  contractEndDate: string | null
}

export interface DeclarationSummary {
  id: number
  financialYear: string
  versionNumber: number
  status: DeclarationStatus
  submittedAt: string | null
  acknowledgementNumber: string | null
}

export interface ProfileStagingResponse {
  id: number
  templeId: number
  status: string
  submittedByUserId: number
  submittedAt: string
  reviewedByUserId: number | null
  reviewedAt: string | null
  rejectionReason: string | null
  contentSnapshot: string | null
}

export interface ExportJobResponse {
  jobId: string
  format: ExportFormat
  status: 'SYNC_COMPLETE' | 'ASYNC_ACCEPTED'
  downloadUrl: string | null
  recordCount: number
}

export interface NotificationResponse {
  id: number
  title: string
  body: string
  referenceType: string | null
  referenceId: number | null
  read: boolean
  readAt: string | null
  createdAt: string
}
