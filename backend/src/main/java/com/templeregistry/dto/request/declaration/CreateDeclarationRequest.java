package com.templeregistry.dto.request.declaration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class CreateDeclarationRequest {

    @NotBlank(message = "Financial year is required")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Financial year must be in YYYY-YY format")
    private String financialYear;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    @DecimalMin(value = "0.0", inclusive = true, message = "Annual income must be non-negative")
    private BigDecimal annualIncome;

    @DecimalMin(value = "0.0", inclusive = true, message = "Annual expenditure must be non-negative")
    private BigDecimal annualExpenditure;

    @Valid
    private List<AgriLandItemRequest> agriculturalLands = new ArrayList<>();

    @Valid
    private List<BuildingItemRequest> buildings = new ArrayList<>();

    @Valid
    private List<LeasedPropertyItemRequest> leasedProperties = new ArrayList<>();

    @Valid
    private List<OtherLandItemRequest> otherLands = new ArrayList<>();

    @Valid
    private List<PreciousMetalItemRequest> preciousMetals = new ArrayList<>();

    @Valid
    private List<ArtifactItemRequest> artifacts = new ArrayList<>();

    @Valid
    private List<VehicleItemRequest> vehicles = new ArrayList<>();

    @Valid
    private List<EquipmentItemRequest> equipment = new ArrayList<>();

    @Valid
    private List<FinancialAssetItemRequest> financialAssets = new ArrayList<>();
}
