package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for the DC reject declaration workflow action.
 * Remarks are mandatory — a rejection must include a reason.
 * dc_e2e Section 5.2.
 */
@Getter
@NoArgsConstructor
public class WorkflowRejectRequest {

    @NotBlank(message = "Rejection remarks are required.")
    @Size(min = 10, max = 2000, message = "Remarks must be between 10 and 2000 characters.")
    private String remarks;
}
