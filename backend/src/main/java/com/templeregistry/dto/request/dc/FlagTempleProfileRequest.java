package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for DC to flag a temple profile for issues.
 * Reason is mandatory — the Temple Authority must know why the profile was flagged.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FlagTempleProfileRequest {

    @NotBlank(message = "Flagging reason is required.")
    @Size(min = 10, max = 2000, message = "Reason must be between 10 and 2000 characters.")
    private String reason;
}
