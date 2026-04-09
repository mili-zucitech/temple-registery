package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclMovPreciousMetalResponse {
    private Long id;
    private String itemType;
    private BigDecimal weightGrams;
    private String purity;
    private BigDecimal estimatedValue;
}
