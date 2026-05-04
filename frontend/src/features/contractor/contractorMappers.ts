/**
 * Mapper functions for Contractor module
 * Transforms between API DTOs and form models
 */

import type {
  ContractorResponse,
  CreateContractorRequest,
  UpdateContractorRequest,
} from './contractorTypes'

/**
 * Maps a ContractorResponse from the API to CreateContractorRequest form values
 * Used when opening the edit form to pre-populate fields
 */
export function mapContractorToForm(
  contractor: ContractorResponse
): CreateContractorRequest {
  return {
    companyName: contractor.companyName ?? '',
    gstNumber: contractor.gstNumber ?? '',
    serviceType: contractor.serviceType,
    contractReference: contractor.contractReference ?? '',
    workOrderDate: contractor.workOrderDate ?? '',
    contractStartDate: contractor.contractStartDate ?? '',
    contractEndDate: contractor.contractEndDate ?? '',
    contractValue: contractor.contractValue ?? 0,
    paymentStatus: contractor.paymentStatus,
    documentIds: contractor.documentIds ?? [],
  }
}

/**
 * Maps form values back to API request format
 * Used when submitting the update
 */
export function mapFormToContractorUpdate(
  formValues: CreateContractorRequest
): UpdateContractorRequest {
  return {
    ...formValues,
    // Trim string fields
    companyName: formValues.companyName?.trim() || '',
    gstNumber: formValues.gstNumber?.trim() || '',
    contractReference: formValues.contractReference?.trim() || '',
    // Ensure dates are properly formatted
    workOrderDate: formValues.workOrderDate || '',
    contractStartDate: formValues.contractStartDate || '',
    contractEndDate: formValues.contractEndDate || '',
    // Ensure numeric values
    contractValue: formValues.contractValue ?? 0,
    // Ensure array is not null
    documentIds: formValues.documentIds ?? [],
  }
}
