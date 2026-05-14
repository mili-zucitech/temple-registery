/**
 * Mapper functions for Trust module
 * Transforms between API DTOs and form models
 */

import type {
  BoardMemberResponse,
  UpdateBoardMemberRequest,
} from './trustTypes'

/**
 * Maps a BoardMemberResponse from the API to UpdateBoardMemberRequest form values
 * Used when opening the edit form to pre-populate fields
 */
export function mapBoardMemberToForm(
  member: BoardMemberResponse
): UpdateBoardMemberRequest {
  return {
    fullName: member.fullName ?? '',
    designation: member.designation ?? '',
    contactNumber: member.contactNumber ?? '',
    address: member.address ?? '',
    tenureEndDate: member.tenureEndDate ?? '',
    isCurrent: member.isCurrent,
  }
}

/**
 * Maps form values back to API request format
 * Used when submitting the update
 */
export function mapFormToBoardMemberUpdate(
  formValues: UpdateBoardMemberRequest
): UpdateBoardMemberRequest {
  // In this case, the form structure matches the API structure
  // But we keep this function for consistency and future changes
  return {
    ...formValues,
    // Ensure empty strings are preserved (backend handles them)
    fullName: formValues.fullName?.trim() || '',
    designation: formValues.designation?.trim() || '',
    contactNumber: formValues.contactNumber?.trim() || '',
    address: formValues.address?.trim() || '',
    tenureEndDate: formValues.tenureEndDate || '',
  }
}
