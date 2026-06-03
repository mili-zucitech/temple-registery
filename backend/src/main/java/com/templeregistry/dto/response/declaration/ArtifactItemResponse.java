package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtifactItemResponse extends AssetItemResponse {
    private String itemDescription;
    private String material;
    private String ageOrPeriod;
    private String provenance;
    private String museumGradeClassification;
    private BigDecimal approximateValueInr;
}
