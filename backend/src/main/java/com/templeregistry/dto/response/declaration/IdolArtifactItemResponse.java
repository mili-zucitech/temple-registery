package com.templeregistry.dto.response.declaration;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class IdolArtifactItemResponse {
    private Long id;
    private Long declarationId;
    private String itemDescription;
    private String material;
    private String agePeriod;
    private String knownProvenance;
    private Boolean museumGradeClassification;
    private String name;
    private java.math.BigDecimal estimatedValue;
    private String storageLocation;
    private String documentReference;
}
