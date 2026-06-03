package com.templeregistry.dto.request.governance;

import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for DC updating physical verification status.
 * Allowed transitions: ORDERED_FOR_PHYSICAL_VERIFICATION → PHYSICALLY_VERIFIED or VERIFICATION_FAILED
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdatePhysicalVerificationRequest {

    @NotNull(message = "New physical verification status is required.")
    private PhysicalVerificationStatus newStatus;

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters.")
    private String notes;
}
