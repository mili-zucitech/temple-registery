package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for DC to reject an employee record.
 * Reason is mandatory.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RejectEmployeeRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(min = 10, max = 2000, message = "Reason must be between 10 and 2000 characters")
    private String reason;
}
