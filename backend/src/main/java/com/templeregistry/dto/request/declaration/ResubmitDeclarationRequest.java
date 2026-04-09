package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter @NoArgsConstructor
public class ResubmitDeclarationRequest {
    @NotBlank @Size(max = 2000) private String correctionNotes;

    // Updated fields (same as CreateDeclarationRequest)
    private BigDecimal agriculturalLandAcres;
    private BigDecimal agriculturalLandValue;
    private BigDecimal buildingsSqft;
    private BigDecimal buildingsValue;
    private Integer leasedPropertiesCount;
    private BigDecimal leasedPropertiesValue;
    private BigDecimal otherLandValue;
    private BigDecimal goldGrams;
    private BigDecimal silverGrams;
    private Integer idolsCount;
    private Integer vehiclesCount;
    private BigDecimal financialAssetsValue;
    private BigDecimal otherMovableValue;
}
