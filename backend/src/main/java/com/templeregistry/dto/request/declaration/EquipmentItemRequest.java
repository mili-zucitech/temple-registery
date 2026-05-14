package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Request DTO for Electronic & Office Equipment asset items.
 * Maps to decl_mov_equipment table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Item name is required")
    @Size(max = 255, message = "Item name must not exceed 255 characters")
    private String itemName;
    
    @Size(max = 100, message = "Serial number must not exceed 100 characters")
    private String serialNumber;
    
    @NotNull(message = "Approximate value is required")
    @DecimalMin(value = "0", message = "Approximate value must be non-negative")
    @Digits(integer = 15, fraction = 2, message = "Approximate value must have at most 15 integer digits and 2 decimal places")
    private BigDecimal approximateValueInr;
}
