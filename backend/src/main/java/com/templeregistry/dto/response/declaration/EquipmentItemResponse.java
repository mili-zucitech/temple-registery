package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipmentItemResponse extends AssetItemResponse {
    private String itemName;
    private String serialNumber;
    private BigDecimal approximateValueInr;
}
