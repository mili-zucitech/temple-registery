package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclImmovBuildingResponse {
    private Long id;
    private String location;
    private BigDecimal totalAreaSqft;
    private Integer yearBuilt;
    private String structureType;
    private BigDecimal valuationInr;
}
