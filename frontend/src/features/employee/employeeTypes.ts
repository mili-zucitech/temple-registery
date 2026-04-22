import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const EMPLOYEE_TYPES = ['PRIEST', 'ADMINISTRATIVE', 'MAINTENANCE', 'SECURITY', 'OTHER'] as const
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]

export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'RETIRED', 'RESIGNED'] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const TERMINAL_EMPLOYEE_STATUSES: EmployeeStatus[] = ['RETIRED', 'RESIGNED']

// ── Request schemas ───────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, 'Name is required').max(200),
  employeeType: z.enum(EMPLOYEE_TYPES),
  designation: z.string().max(150).optional(),
  dateOfJoining: z.string().optional(),
  salaryGrade: z.string().max(50).optional(),
  mobile: z.string().max(15).optional(),
  address: z.string().optional(),
  isHereditary: z.boolean().default(false),
})

export const updateEmployeeSchema = z.object({
  fullName: z.string().max(200).optional(),
  employeeType: z.enum(EMPLOYEE_TYPES).optional(),
  designation: z.string().max(150).optional(),
  salaryGrade: z.string().max(50).optional(),
  mobile: z.string().max(15).optional(),
  address: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  dateOfLeaving: z.string().optional(),
})

export type CreateEmployeeRequest = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeSchema>

// ── Response types ────────────────────────────────────────────────────────────

export interface EmployeeResponse {
  id: number
  templeId: number
  employeeRef?: string
  fullName: string
  employeeType: EmployeeType
  designation?: string
  dateOfJoining?: string
  salaryGrade?: string
  mobile?: string
  address?: string
  status: EmployeeStatus
  isHereditary: boolean
  dateOfLeaving?: string
  createdAt?: string
  updatedAt?: string
}
