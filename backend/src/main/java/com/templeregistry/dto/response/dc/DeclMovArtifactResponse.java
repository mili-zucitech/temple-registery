package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclMovArtifactResponse {
    private Long id;
    private String itemDescription;
    private String material;
    private String ageOrPeriod;
    private String provenance;
    private String museumGradeClassification;
    private BigDecimal approximateValueInr;
    private BigDecimal estimatedValueInr;
}
