package com.templeregistry.dto.request.declaration;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for Leased Property asset items.
 * Maps to decl_immov_leased table.
 */
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeasedPropertyItemRequest extends AssetItemRequest {
    
    @NotBlank(message = "Property address is required")
    @Size(max = 500, message = "Property address must not exceed 500 characters")
    private String propertyAddress;
    
    @NotBlank(message = "Lessee name is required")
    @Size(max = 255, message = "Lessee name must not exceed 255 characters")
    private String lesseeName;
    
    @NotNull(message = "Lease start date is required")
    private LocalDate leaseStartDate;
    
    @NotNull(message = "Lease end date is required")
    private LocalDate leaseEndDate;
    
    @NotNull(message = "Monthly rent is required")
    @DecimalMin(value = "0", message = "Monthly rent must be non-negative")
    @Digits(integer = 15, fraction = 2, message = "Monthly rent must have at most 15 integer digits and 2 decimal places")
    private BigDecimal monthlyRent;

    private Long agreementDocumentId;
    
    @AssertTrue(message = "Lease end date must be after start date")
    public boolean isLeaseEndDateValid() {
        if (leaseStartDate == null || leaseEndDate == null) {
            return true; // Let @NotNull handle null validation
        }
        return !leaseEndDate.isBefore(leaseStartDate);
    }
}
