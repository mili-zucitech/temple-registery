package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ResubmitDeclarationRequest extends CreateDeclarationRequest {

    @NotBlank(message = "Clarification response is required")
    @Size(max = 2000, message = "Clarification response must not exceed 2000 characters")
    private String clarificationResponse;
}
