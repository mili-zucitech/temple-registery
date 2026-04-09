package com.templeregistry.dto.response.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Builder
public class DeclarationResponse {
    private Long id; private Long templeId; private Long districtId;
    private DeclarationStatus status;
    private BigDecimal agriculturalLandAcres; private BigDecimal agriculturalLandValue;
    private BigDecimal buildingsSqft; private BigDecimal buildingsValue;
    private Integer leasedPropertiesCount; private BigDecimal leasedPropertiesValue;
    private BigDecimal otherLandValue; private BigDecimal goldGrams;
    private BigDecimal silverGrams; private Integer idolsCount;
    private Integer vehiclesCount; private BigDecimal financialAssetsValue;
    private BigDecimal otherMovableValue;
    private LocalDateTime submittedAt; private LocalDateTime reviewedAt;
    private String acknowledgementNumber; private LocalDate dueDate;
}
