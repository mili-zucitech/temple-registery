package com.templeregistry.dto.request.observation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateObservationRequest {

    @NotNull
    private Long templeId;

    @NotBlank
    @Size(max = 40)
    private String entityType;

    @NotNull
    private Long entityId;

    @NotBlank
    @Size(max = 255)
    private String title;

    @NotBlank
    @Size(max = 5000)
    private String description;

    @NotBlank
    private String severity;
}
