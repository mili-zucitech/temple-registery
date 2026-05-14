package com.templeregistry.dto.response.declaration;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class OtherLandItemResponse extends AssetItemResponse {
    private String location;
    private BigDecimal area;
    private String usageType;
    private String revenueDepartmentReference;
}
