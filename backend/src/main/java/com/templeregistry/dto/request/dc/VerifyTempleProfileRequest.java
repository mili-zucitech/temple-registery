package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for DC to verify a temple profile.
 * Remarks are optional.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class VerifyTempleProfileRequest {

    @Size(max = 1000, message = "Remarks must not exceed 1000 characters.")
    private String remarks;
}
