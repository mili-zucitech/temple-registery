package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for Financial Asset items (FDs, Investments, etc.).
 * Maps to decl_mov_financial table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialAssetItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Asset subtype is required")
    @Size(max = 100, message = "Asset subtype must not exceed 100 characters")
    private String assetSubtype;

    @Size(max = 255, message = "Bank name must not exceed 255 characters")
    private String bankName;

    @Size(max = 100, message = "Investment type must not exceed 100 characters")
    private String investmentType;

    @NotNull(message = "Amount / value is required")
    @DecimalMin(value = "0", message = "Amount / value must be non-negative")
    @Digits(integer = 18, fraction = 2, message = "Amount / value must have at most 18 integer digits and 2 decimal places")
    private BigDecimal amount;

    private LocalDate maturityDate;
}
