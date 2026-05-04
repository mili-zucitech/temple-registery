/**
 * Mapper functions for Employee module
 * Transforms between API DTOs and form models
 */

import type {
  EmployeeResponse,
  UpdateEmployeeRequest,
} from './employeeTypes'

/**
 * Maps an EmployeeResponse from the API to UpdateEmployeeRequest form values
 * Used when opening the edit form to pre-populate fields
 */
export function mapEmployeeToForm(
  employee: EmployeeResponse
): UpdateEmployeeRequest {
  return {
    fullName: employee.fullName ?? '',
    employeeType: employee.employeeType,
    designation: employee.designation ?? '',
    salaryGrade: employee.salaryGrade ?? '',
    mobile: employee.mobile ?? '',
    address: employee.address ?? '',
    status: employee.status,
    dateOfLeaving: employee.dateOfLeaving ?? '',
  }
}

/**
 * Maps form values back to API request format
 * Used when submitting the update
 */
export function mapFormToEmployeeUpdate(
  formValues: UpdateEmployeeRequest
): UpdateEmployeeRequest {
  return {
    ...formValues,
    // Trim string fields
    fullName: formValues.fullName?.trim() || '',
    designation: formValues.designation?.trim() || '',
    salaryGrade: formValues.salaryGrade?.trim() || '',
    mobile: formValues.mobile?.trim() || '',
    address: formValues.address?.trim() || '',
    dateOfLeaving: formValues.dateOfLeaving || '',
  }
}
