package com.templeregistry.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateNotificationRuleRequest {

    @NotNull
    private Boolean enabled;

    private String priority;

    private String description;
}
