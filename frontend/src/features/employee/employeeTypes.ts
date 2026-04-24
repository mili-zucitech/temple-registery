import { z } from 'zod'

// ── Enums ─────────────────────────────────────────────────────────────────────

export const EMPLOYEE_TYPES = ['PRIEST', 'ADMINISTRATIVE', 'MAINTENANCE', 'SECURITY', 'OTHER'] as const
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number]

export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'RETIRED', 'RESIGNED'] as const
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number]

export const TERMINAL_EMPLOYEE_STATUSES: EmployeeStatus[] = ['RETIRED', 'RESIGNED']

// ── Validation helpers ────────────────────────────────────────────────────────

const nameRegex = /^[a-zA-Z\s.'-]+$/
const mobileRegex = /^[6-9]\d{9}$/
const dateRegex = /^\d{4}-\d{2}-\d{2}$/

// ── Request schemas ───────────────────────────────────────────────────────────

export const createEmployeeSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must not exceed 200 characters')
    .regex(nameRegex, 'Name can only contain letters, spaces, dots, hyphens and apostrophes')
    .refine((val) => val.trim().length >= 2, 'Name cannot be just spaces'),
  
  employeeType: z.enum(EMPLOYEE_TYPES, {
    errorMap: () => ({ message: 'Please select a valid employee type' })
  }),
  
  designation: z.string()
    .max(150, 'Designation must not exceed 150 characters')
    .optional()
    .or(z.literal('')),
  
  dateOfJoining: z.string()
    .regex(dateRegex, 'Invalid date format')
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date <= today
    }, 'Date of joining cannot be in the future')
    .optional()
    .or(z.literal('')),
  
  salaryGrade: z.string()
    .max(50, 'Salary grade must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  mobile: z.string()
    .regex(mobileRegex, 'Mobile number must be a valid 10-digit Indian number starting with 6-9')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  
  isHereditary: z.boolean().default(false),
})

export const updateEmployeeSchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(200, 'Name must not exceed 200 characters')
    .regex(nameRegex, 'Name can only contain letters, spaces, dots, hyphens and apostrophes')
    .refine((val) => val.trim().length >= 2, 'Name cannot be just spaces')
    .optional(),
  
  employeeType: z.enum(EMPLOYEE_TYPES, {
    errorMap: () => ({ message: 'Please select a valid employee type' })
  }).optional(),
  
  designation: z.string()
    .max(150, 'Designation must not exceed 150 characters')
    .optional()
    .or(z.literal('')),
  
  salaryGrade: z.string()
    .max(50, 'Salary grade must not exceed 50 characters')
    .optional()
    .or(z.literal('')),
  
  mobile: z.string()
    .regex(mobileRegex, 'Mobile number must be a valid 10-digit Indian number starting with 6-9')
    .optional()
    .or(z.literal('')),
  
  address: z.string()
    .max(500, 'Address must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  
  status: z.enum(EMPLOYEE_STATUSES, {
    errorMap: () => ({ message: 'Please select a valid status' })
  }).optional(),
  
  dateOfLeaving: z.string()
    .regex(dateRegex, 'Invalid date format')
    .refine((val) => {
      if (!val) return true
      const date = new Date(val)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return date <= today
    }, 'Date of leaving cannot be in the future')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  // If status is terminal (RETIRED/RESIGNED), dateOfLeaving is required
  if (data.status && TERMINAL_EMPLOYEE_STATUSES.includes(data.status as EmployeeStatus)) {
    return !!data.dateOfLeaving && data.dateOfLeaving.trim() !== ''
  }
  return true
}, {
  message: 'Date of leaving is required when status is Retired or Resigned',
  path: ['dateOfLeaving'],
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
