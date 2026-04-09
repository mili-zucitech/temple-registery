package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclImmovOtherResponse {
    private Long id;
    private String description;
    private BigDecimal area;
    private BigDecimal valuation;
}
