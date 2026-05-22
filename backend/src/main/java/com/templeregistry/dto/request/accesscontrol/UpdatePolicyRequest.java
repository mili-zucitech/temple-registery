package com.templeregistry.dto.request.accesscontrol;

import com.templeregistry.entity.accesscontrol.enums.PolicyEffect;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePolicyRequest {

    @NotNull(message = "effect is required")
    private PolicyEffect effect;

    @NotNull(message = "active is required")
    private Boolean active;

    private String conditions;
}
