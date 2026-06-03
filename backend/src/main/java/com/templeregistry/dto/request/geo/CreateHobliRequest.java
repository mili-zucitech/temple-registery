package com.templeregistry.dto.request.geo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @NoArgsConstructor
public class CreateHobliRequest {
    @NotNull(message = "Taluk ID is required.") private Long talukId;
    @NotBlank(message = "Hobli name is required.")
    @Size(max = 100) private String name;
}
