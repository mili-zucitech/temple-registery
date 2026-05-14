package com.templeregistry.dto.request.governance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for DC Reject action.
 * Rejection is terminal — the temple authority must create a new submission from DRAFT.
 */
@Getter
@Setter
@NoArgsConstructor
public class RejectRequest {

    @NotBlank(message = "Rejection reason is mandatory.")
    @Size(min = 10, max = 2000, message = "Rejection reason must be between 10 and 2000 characters.")
    private String reason;
}
