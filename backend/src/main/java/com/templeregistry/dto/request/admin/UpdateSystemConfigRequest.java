package com.templeregistry.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateSystemConfigRequest {

    @NotBlank
    @Size(max = 1000)
    private String configValue;

    @Size(max = 500)
    private String description;
}
