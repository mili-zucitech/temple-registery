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
public class GoldSilverItemRequest {

    @NotBlank(message = "Item description is required")
    private String itemDescription;

    @NotNull(message = "Weight in grams is required")
    @DecimalMin(value = "0.01", message = "Weight must be greater than 0")
    private BigDecimal weightGrams;

    private String purity; // e.g., "22K", "24K", "999"

    @DecimalMin(value = "0.0", message = "Approximate value must be non-negative")
    private BigDecimal approximateValue;
}
