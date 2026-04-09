package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclImmovBuildingResponse {
    private Long id;
    private String structureType;
    private BigDecimal areaSqft;
    private String conditionText;
    private BigDecimal valuation;
}
