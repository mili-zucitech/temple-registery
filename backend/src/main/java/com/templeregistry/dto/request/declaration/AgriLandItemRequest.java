package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for Agricultural Land asset items.
 * Maps to decl_immov_agri_land table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgriLandItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Survey number is required")
    @Size(max = 100, message = "Survey number must not exceed 100 characters")
    private String surveyNumber;
    
    @NotBlank(message = "Village is required")
    @Size(max = 500, message = "Village must not exceed 500 characters")
    private String village;
    
    @NotNull(message = "Area in acres is required")
    @DecimalMin(value = "0.0001", message = "Area must be greater than 0")
    @Digits(integer = 10, fraction = 4, message = "Area must have at most 10 integer digits and 4 decimal places")
    private BigDecimal areaAcres;
    
    @Size(max = 1000, message = "Owner of record must not exceed 1000 characters")
    private String ownerOfRecord;

    @Size(max = 50, message = "Patta status must not exceed 50 characters")
    private String pattaStatus;
}
