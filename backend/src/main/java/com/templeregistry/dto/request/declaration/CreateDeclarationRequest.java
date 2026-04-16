package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter @NoArgsConstructor
public class CreateDeclarationRequest {
    @NotNull(message = "Agricultural land acres must not be null")
    @PositiveOrZero(message = "Acres cannot be negative")
    private BigDecimal agriculturalLandAcres;

    @NotNull(message = "Agricultural land value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal agriculturalLandValue;

    @NotNull(message = "Buildings square footage must not be null")
    @PositiveOrZero(message = "Square footage cannot be negative")
    private BigDecimal buildingsSqft;

    @NotNull(message = "Buildings value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal buildingsValue;

    @NotNull(message = "Leased properties count must not be null")
    @PositiveOrZero(message = "Count cannot be negative")
    private Integer leasedPropertiesCount;

    @NotNull(message = "Leased properties value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal leasedPropertiesValue;

    @NotNull(message = "Other land value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal otherLandValue;

    @NotNull(message = "Gold grams must not be null")
    @PositiveOrZero(message = "Grams cannot be negative")
    private BigDecimal goldGrams;

    @NotNull(message = "Silver grams must not be null")
    @PositiveOrZero(message = "Grams cannot be negative")
    private BigDecimal silverGrams;

    @NotNull(message = "Idols count must not be null")
    @PositiveOrZero(message = "Count cannot be negative")
    private Integer idolsCount;

    @NotNull(message = "Vehicles count must not be null")
    @PositiveOrZero(message = "Count cannot be negative")
    private Integer vehiclesCount;

    @NotNull(message = "Financial assets value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal financialAssetsValue;

    @NotNull(message = "Other movable value must not be null")
    @PositiveOrZero(message = "Value cannot be negative")
    private BigDecimal otherMovableValue;

    @NotNull(message = "Due date must not be null")
    private java.time.LocalDate dueDate;
}
