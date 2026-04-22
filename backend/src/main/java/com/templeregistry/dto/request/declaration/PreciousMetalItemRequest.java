package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for Gold & Silver asset items.
 * Maps to decl_mov_precious_metal table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreciousMetalItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Item description is required")
    private String itemDescription;
    
    @Size(max = 100, message = "Metal type must not exceed 100 characters")
    private String metalType;
    
    @NotNull(message = "Weight in grams is required")
    @DecimalMin(value = "0.001", message = "Weight must be greater than 0")
    @Digits(integer = 10, fraction = 3, message = "Weight must have at most 10 integer digits and 3 decimal places")
    private BigDecimal weightGrams;
    
    @NotBlank(message = "Purity is required")
    @Size(max = 50, message = "Purity must not exceed 50 characters")
    private String purity; // 22K, 24K, 18K, 999, etc.
    
    @NotNull(message = "Estimated value is required")
    @DecimalMin(value = "0", message = "Estimated value must be non-negative")
    @Digits(integer = 15, fraction = 2, message = "Estimated value must have at most 15 integer digits and 2 decimal places")
    private BigDecimal approximateValueInr;
}
