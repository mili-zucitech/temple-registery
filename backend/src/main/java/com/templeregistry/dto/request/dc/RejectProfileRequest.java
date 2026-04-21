package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for the DC reject temple profile staging action.
 * Remarks are mandatory — the Temple Authority must know why the profile was rejected.
 * dc_e2e Section 5.3 — profile workflow.
 */
@Getter
@NoArgsConstructor
public class RejectProfileRequest {

    @NotBlank(message = "Rejection remarks are required.")
    @Size(min = 10, max = 2000, message = "Remarks must be between 10 and 2000 characters.")
    private String reason;

    public String getReason() {
        return reason;
    }
}
