package com.templeregistry.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TempleStatusChangeRequest {

    @NotBlank
    @Size(min = 5, max = 500)
    private String reason;
}
