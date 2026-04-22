package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for Building/Temple Complex asset items.
 * Maps to decl_immov_building table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Location is required")
    @Size(max = 500, message = "Location must not exceed 500 characters")
    private String location;
    
    @NotNull(message = "Total area in sqft is required")
    @DecimalMin(value = "1", message = "Area must be at least 1 sqft")
    @Digits(integer = 12, fraction = 2, message = "Area must have at most 12 integer digits and 2 decimal places")
    private BigDecimal totalAreaSqft;
    
    @Min(value = 1800, message = "Year built must be after 1800")
    @Max(value = 2100, message = "Year built must be before 2100")
    private Integer yearBuilt;
    
    @NotBlank(message = "Structure type is required")
    @Size(max = 100, message = "Structure type must not exceed 100 characters")
    private String structureType;
    
    @NotNull(message = "Valuation is required")
    @DecimalMin(value = "0", message = "Valuation must be non-negative")
    @Digits(integer = 18, fraction = 2, message = "Valuation must have at most 18 integer digits and 2 decimal places")
    private BigDecimal valuationInr;
}
