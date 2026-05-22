package com.templeregistry.dto.request.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFieldMaskRequest {

    @NotBlank(message = "fieldKey is required")
    @Size(max = 255)
    private String fieldKey;

    @NotNull(message = "subjectType is required")
    private SubjectType subjectType;

    @NotBlank(message = "subjectValue is required")
    @Size(max = 100)
    private String subjectValue;

    private boolean maskEnabled = true;

    @Size(max = 50)
    private String maskPattern = "****";
}
