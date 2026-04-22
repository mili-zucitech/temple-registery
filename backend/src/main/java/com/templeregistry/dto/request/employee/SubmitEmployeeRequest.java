package com.templeregistry.dto.request.employee;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request to submit employee record for DC review.
 * Transitions submission_status from DRAFT to PENDING_REVIEW.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitEmployeeRequest {
    
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
}
