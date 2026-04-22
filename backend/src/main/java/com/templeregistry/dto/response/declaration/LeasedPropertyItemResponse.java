package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeasedPropertyItemResponse extends AssetItemResponse {
    private String propertyAddress;
    private String lesseeName;
    private LocalDate leaseStartDate;
    private LocalDate leaseEndDate;
    private BigDecimal monthlyRent;
    private Long agreementDocumentId;
}
