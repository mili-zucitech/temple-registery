package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for the DC approve temple profile staging action.
 * Remarks are optional.
 * dc_e2e Section 5.3 — profile workflow.
 */
@Getter
@NoArgsConstructor
public class ApproveProfileRequest {

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters.")
    private String remarks;
}
