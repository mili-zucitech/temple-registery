package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinancialAssetItemResponse extends AssetItemResponse {
    private String assetSubtype;
    private String bankName;
    private String investmentType;
    private BigDecimal amount;
    private LocalDate maturityDate;
}
