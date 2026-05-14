package com.templeregistry.dto.request.governance;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for DC ordering physical verification on an Asset Declaration.
 * Notes are optional but recommended.
 */
@Getter
@Setter
@NoArgsConstructor
public class OrderPhysicalVerificationRequest {

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters.")
    private String notes;
}
