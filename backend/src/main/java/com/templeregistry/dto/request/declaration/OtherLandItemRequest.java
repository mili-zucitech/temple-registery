package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OtherLandItemRequest {

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Area is required")
    @DecimalMin(value = "0.01", message = "Area must be greater than 0")
    private BigDecimal area;

    @NotBlank(message = "Usage type is required")
    private String usageType;

    private String revenueDepartmentReference;
}
