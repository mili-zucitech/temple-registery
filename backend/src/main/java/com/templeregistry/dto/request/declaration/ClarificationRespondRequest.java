package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Request DTO for Temple Authority to respond to a clarification request.
 * Only the message is accepted — no asset field changes are allowed.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationRespondRequest {

    @NotBlank(message = "Response message must not be blank.")
    private String message;
}
