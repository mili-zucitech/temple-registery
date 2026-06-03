package com.templeregistry.dto.request.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import com.templeregistry.entity.accesscontrol.enums.SubjectType;
import com.templeregistry.entity.accesscontrol.enums.TargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePolicyRequest {

    @NotNull(message = "targetType is required")
    private TargetType targetType;

    @NotBlank(message = "targetKey is required")
    @Size(max = 255)
    private String targetKey;

    @NotNull(message = "subjectType is required")
    private SubjectType subjectType;

    @NotBlank(message = "subjectValue is required")
    @Size(max = 100)
    private String subjectValue;

    @NotNull(message = "effect is required")
    private PolicyEffect effect;

    private boolean active = true;

    /** Optional SpEL/CEL expression for contextual rules. Reserved for future use. */
    private String conditions;
}
