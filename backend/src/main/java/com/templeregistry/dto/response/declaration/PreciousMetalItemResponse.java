package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreciousMetalItemResponse extends AssetItemResponse {
    private String itemDescription;
    private String metalType;
    private BigDecimal weightGrams;
    private String purity;
    private BigDecimal approximateValueInr;
}
