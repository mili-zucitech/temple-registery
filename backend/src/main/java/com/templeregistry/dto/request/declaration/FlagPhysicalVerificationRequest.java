package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class FlagPhysicalVerificationRequest {
    @NotBlank(message = "Notes are required.")
    @Size(max = 2000, message = "Notes must not exceed 2000 characters.")
    private String notes;
}
