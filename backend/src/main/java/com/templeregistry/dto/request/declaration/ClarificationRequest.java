package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor @AllArgsConstructor
public class ClarificationRequest {
    @NotBlank(message = "Message is required.")
    @Size(max = 2000, message = "Message must not exceed 2000 characters.")
    private String message;
}
