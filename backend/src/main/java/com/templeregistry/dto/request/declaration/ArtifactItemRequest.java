package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for Idols & Sacred Artifacts asset items.
 * Maps to decl_mov_artifact table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtifactItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Artifact description is required")
    private String itemDescription;
    
    @NotBlank(message = "Material is required")
    @Size(max = 100, message = "Material must not exceed 100 characters")
    private String material;

    @Size(max = 100, message = "Age / period must not exceed 100 characters")
    private String ageOrPeriod;

    private String provenance;

    @Size(max = 100, message = "Museum-grade classification must not exceed 100 characters")
    private String museumGradeClassification;

    @DecimalMin(value = "0", message = "Estimated value must be non-negative")
    @Digits(integer = 18, fraction = 2, message = "Estimated value must have at most 18 integer digits and 2 decimal places")
    private BigDecimal approximateValueInr;
}
