package com.templeregistry.dto.request.geo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class CreateStateRequest {
    @NotBlank(message = "State name is required.")
    @Size(max = 100) private String name;
    @NotBlank(message = "State code is required.")
    @Size(max = 10) private String code;
}
