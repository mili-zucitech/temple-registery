package com.templeregistry.dto.request.governance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body for DC Send Back action.
 * The free-text reason is MANDATORY — no dropdowns, no optional fields.
 */
@Getter
@Setter
@NoArgsConstructor
public class SendBackRequest {

    @NotBlank(message = "Send back reason is mandatory. Please provide a clear explanation for the temple authority.")
    @Size(min = 10, max = 2000, message = "Send back reason must be between 10 and 2000 characters.")
    private String reason;
}
