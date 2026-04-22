import { z } from 'zod'

// ─── Enums ───────────────────────────────────────────────────────────────────

export const DC_ROLES = ['DISTRICT_COLLECTOR', 'DC_STAFF', 'SUPER_ADMIN'] as const
export type DcRole = (typeof DC_ROLES)[number]

export const DECLARATION_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'UNDER_REVIEW',
  'RESUBMITTED',
  'CLARIFICATION_REQUESTED',
  'PHYSICAL_VERIFICATION_REQUESTED',
  'APPROVED',
  'REJECTED',
  'OVERDUE',
] as const
export type DeclarationStatus = (typeof DECLARATION_STATUSES)[number]

export const EXPORT_FORMATS = ['CSV', 'PDF'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

// ─── Request schemas ─────────────────────────────────────────────────────────

export const dcTempleSearchFilterSchema = z.object({
  districtId: z.number().optional(),
  cityId: z.number().optional(),
  talukId: z.number().optional(),
  hobliId: z.number().optional(),
  grade: z.array(z.string()).optional(),
  keyword: z.string().optional(),
  deityName: z.string().optional(),
  tradition: z.string().optional(),
  trustRegistered: z.boolean().optional(),
  declarationStatus: z.string().optional(),
  hasApprovedDeclaration: z.boolean().optional(),
  pendingProfileReview: z.boolean().optional(),
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
  reason: z
    .string()
    .min(50, 'Rejection reason must be at least 50 characters.')
    .max(1000, 'Reason cannot exceed 1000 characters.')
    .refine((v) => v.trim().length >= 50, {
      message: 'Rejection reason must contain at least 50 non-whitespace characters.',
    }),
})

export const dcClarifySchema = z.object({
  notes: z
    .string()
    .min(20, 'Clarification notes must be at least 20 characters.')
    .max(2000, 'Notes cannot exceed 2000 characters.')
    .refine((v) => v.trim().length >= 20, {
      message: 'Clarification notes must contain at least 20 non-whitespace characters.',
    }),
})

export const approveProfileSchema = z.object({
  notes: z.string().max(1000).optional(),
})

export const rejectProfileSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
})

export const dcFlagSchema = z.object({
  reason: z.string().min(1, 'Flag reason is required').max(1000),
})

export const dcVerifySchema = z.object({
  notes: z.string().max(1000).optional(),
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
export type DcFlagRequest = z.infer<typeof dcFlagSchema>
export type DcVerifyRequest = z.infer<typeof dcVerifySchema>

// ─── Response types ───────────────────────────────────────────────────────────

export interface GradeDistributionItem {
  grade: string
  count: number
}

export interface AreaDistributionItem {
  areaId: number
  count: number
}

export interface DcContextResponse {
  userId: number
  username: string
  fullName: string
  role: DcRole
  aadhaarVerified: boolean
  districtId: number | null
  districtName: string | null
  cityId: number | null
}

export interface DcDashboardResponse {
  totalTemples: number
  pendingDeclarations: number
  overdueDeclarations: number
  pendingProfileReviews: number
  templesWithoutApprovedDeclaration: number
  gradeDistribution: GradeDistributionItem[]
  talukDistribution?: AreaDistributionItem[]
  districtDistribution?: AreaDistributionItem[]
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
  message?: string
  notes: string
  sectionName?: string | null
  fieldNamesJson?: string | null
  respondedAt: string | null
  createdAt: string
}

export interface DeclImmovAgriLandResponse {
  id: number
  surveyNumber: string | null
  village: string | null
  areaAcres: number | null
  ownerOfRecord: string | null
  pattaStatus: string | null
  villageName?: string | null
  estimatedValueInr?: number | null
}

export interface DeclImmovBuildingResponse {
  id: number
  location: string | null
  totalAreaSqft: number | null
  yearBuilt: number | null
  structureType: string | null
  valuationInr: number | null
  buildingName?: string | null
  totalSqft?: number | null
  estimatedValueInr?: number | null
}

export interface DeclImmovLeasedResponse {
  id: number
  propertyAddress: string | null
  lesseeName: string | null
  leaseStartDate: string | null
  leaseEndDate: string | null
  monthlyRent: number | null
  agreementDocumentId: number | null
  lesseeOrLandlordName?: string | null
  annualRent?: number | null
}

export interface DeclImmovOtherResponse {
  id: number
  location: string | null
  area: number | null
  usageType: string | null
  revenueDepartmentReference: string | null
  description?: string | null
  estimatedValueInr?: number | null
}

export interface DeclMovArtifactResponse {
  id: number
  itemDescription: string | null
  material: string | null
  ageOrPeriod: string | null
  provenance: string | null
  museumGradeClassification: string | null
  approximateValueInr: number | null
  artifactName?: string | null
  estimatedValueInr?: number | null
}

export interface DeclMovEquipmentResponse {
  id: number
  itemName: string | null
  serialNumber: string | null
  approximateValueInr: number | null
  equipmentName?: string | null
  quantity?: number | null
  estimatedValueInr?: number | null
}

export interface DeclMovPreciousMetalResponse {
  id: number
  itemDescription: string | null
  metalType: string | null
  weightGrams: number | null
  purity: string | null
  approximateValueInr: number | null
  estimatedValueInr?: number | null
}

export interface DeclMovVehicleResponse {
  id: number
  registrationNumber: string | null
  makeModel: string | null
  year: number | null
  purpose: string | null
  vehicleType?: string | null
  estimatedValueInr?: number | null
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
  agriculturalLands: DeclImmovAgriLandResponse[]
  agricultureLands?: DeclImmovAgriLandResponse[]
  buildings: DeclImmovBuildingResponse[]
  leasedProperties: DeclImmovLeasedResponse[]
  otherLands: DeclImmovOtherResponse[]
  otherImmovables?: DeclImmovOtherResponse[]
  artifacts: DeclMovArtifactResponse[]
  equipment: DeclMovEquipmentResponse[]
  preciousMetals: DeclMovPreciousMetalResponse[]
  vehicles: DeclMovVehicleResponse[]
}

export interface DcTrustSummary {
  id: number
  trustName: string
  trustType: string | null
  registrationNumber: string | null
  registeringAuthority: string | null
  dateOfRegistration: string | null
  panNumberMasked: string | null
  bankAccountMasked: string | null
  bankName: string | null
  bankBranch: string | null
  annualIncome: number | null
  isVerifiedByDc: boolean
  dcFlagReason: string | null
  reviewStatus: 'APPROVED' | 'PENDING' | 'FLAGGED'
  validationIssues: string[]
  financialStatus: 'SUBMITTED' | 'MISSING'
}

export interface TrustFinancialSummary {
  financialYear: string
  annualIncome: number | null
  annualExpenditure: number | null
}

export interface ProfileCurrentResponse {
  contactPersonName: string | null
  contactPersonDesignation: string | null
  photoFilePath: string | null
  languagesOfWorship: string | null
  linkedInstitutions: string | null
  annualFestivals: string | null
  landmark: string | null
  historicalSignificance: string | null
}

/** Shape mirrors backend TempleFullProfileResponse */
export interface TempleFullProfileResponse {
  temple: {
    id: number
    registrationNumber: string | null
    name: string
    aliasName: string | null
    grade: string
    primaryDeity: string | null
    tradition: string
    yearEstablished: number | null
    history: string | null
    doorNumber: string | null
    street: string | null
    villageTown: string | null
    pinCode: string | null
    hobliId: number | null
    talukId: number | null
    districtId: number | null
    latitude: number | null
    longitude: number | null
    contactName: string | null
    contactDesignation: string | null
    contactMobile: string | null
    contactEmail: string | null
    photoUrl: string | null
    languagesOfWorship: string | null
    trustRegistered: boolean
    assetDeclarationStatus: string | null
    verificationStatus?: 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'FLAGGED'
    /** Reason provided when DC flagged the temple. Null when not flagged. */
    dcFlagReason?: string | null
  }
  hobliName: string | null
  talukName: string | null
  districtName: string | null
  cityName: string | null
  trust: DcTrustSummary | null
  boardMembers: {
    current: BoardMemberSummary[]
    past: BoardMemberSummary[]
    validationIssues: string[]
  }
  trustFinancials: TrustFinancialSummary[]
  employees: EmployeeSummary[]
  contractors: ContractorResponse[]
  declarations: DeclarationSummary[]
  currentProfile: ProfileCurrentResponse | null
}

export interface BoardMemberSummary {
  id: number
  fullName: string
  designation: string
  contactNumber: string | null
  maskedAadhaar: string | null
  appointmentDate: string | null
  tenureEndDate: string | null
  address: string | null
  isCurrent: boolean
  isVerifiedByDc: boolean
  dcFlagReason: string | null
}

export interface EmployeeSummary {
  id: number
  templeId: number
  employeeRef: string | null
  fullName: string
  employeeType: string
  designation: string
  dateOfJoining: string | null
  salaryGrade: string | null
  mobile: string | null
  address: string | null
  status: string
  isHereditary: boolean
}

export interface ContractorResponse {
  id: number
  templeId: number
  name: string
  gstNumber: string | null
  serviceType: 'CIVIL_WORKS' | 'ELECTRICAL' | 'SECURITY' | 'CATERING' | 'EVENTS' | 'OTHER'
  contractReference: string | null
  workOrderDate: string | null
  contractStartDate: string | null
  contractEndDate: string | null
  contractValue: number | null
  paymentStatus: 'PENDING' | 'COMPLETED' | 'DISPUTED'
  documentIds?: number[]
  isVerifiedByDc?: boolean
  dcFlagReason?: string | null
}

export interface DeclarationSummary {
  id: number
  financialYear: string
  versionNumber: number
  status: DeclarationStatus
  submittedAt: string | null
  acknowledgementNumber: string | null
  agriculturalLandValue: number | null
  buildingsValue: number | null
  financialAssetsValue: number | null
  otherMovableValue: number | null
  dueDate: string | null
}

export interface ProfileStagingResponse {
  id: number
  templeId: number
  version: number
  status: string
  contactPersonName: string | null
  contactPersonDesignation: string | null
  photoFilePath: string | null
  languagesOfWorship: string | null
  linkedInstitutions: string | null
  annualFestivals: string | null
  landmark: string | null
  historicalSignificance: string | null
  submittedAt: string
  submittedBy: number
  reviewedAt: string | null
  reviewedBy: number | null
  reviewComment: string | null
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
