package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BuildingItemResponse extends AssetItemResponse {
    private String location;
    private BigDecimal totalAreaSqft;
    private Integer yearBuilt;
    private String structureType;
    private BigDecimal valuationInr;
}
