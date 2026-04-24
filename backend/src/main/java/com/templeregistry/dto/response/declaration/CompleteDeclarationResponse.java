package com.templeregistry.dto.response.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class CompleteDeclarationResponse {
    // Basic declaration info
    private Long id;
    private Long templeId;
    private String templeName;
    private Long districtId;
    private String financialYear;
    private DeclarationStatus status;
    private Integer versionNumber;
    private String acknowledgementNumber;
    private LocalDate dueDate;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime acknowledgedAt;
    private Integer clarificationRound;
    private Boolean isOverdue;
    private LocalDateTime overdueFlaggedAt;
    private Long reviewedBy;
    private String remarks;

    // Annual financials
    private BigDecimal annualIncome;
    private BigDecimal annualExpenditure;

    // Summary values (for backward compatibility)
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

    // Detailed asset lists
    private List<AgriLandItemResponse> agriculturalLands;
    private List<BuildingItemResponse> buildings;
    private List<LeasedPropertyItemResponse> leasedProperties;
    private List<OtherLandItemResponse> otherLands;
    private List<PreciousMetalItemResponse> preciousMetals;
    private List<ArtifactItemResponse> artifacts;
    private List<VehicleItemResponse> vehicles;
    private List<EquipmentItemResponse> equipment;
    private List<FinancialAssetItemResponse> financialAssets;
}
