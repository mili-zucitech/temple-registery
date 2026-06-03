package com.templeregistry.dto.request.geo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class CreateCityRequest {
    @NotNull(message = "State ID is required.") private Long stateId;
    @NotBlank(message = "City name is required.")
    @Size(max = 100) private String name;
}
