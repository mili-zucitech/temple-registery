package com.templeregistry.dto.response.declaration;

import lombok.*;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgriLandItemResponse extends AssetItemResponse {
    private String surveyNumber;
    private String village;
    private BigDecimal areaAcres;
    private String ownerOfRecord;
    private String pattaStatus;
}
