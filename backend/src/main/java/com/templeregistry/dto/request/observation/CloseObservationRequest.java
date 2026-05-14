package com.templeregistry.dto.request.observation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CloseObservationRequest {

    @NotBlank
    @Size(min = 5, max = 1000)
    private String resolutionNote;
}
