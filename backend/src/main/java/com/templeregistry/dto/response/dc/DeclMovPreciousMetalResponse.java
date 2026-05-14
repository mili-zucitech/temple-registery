package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclMovPreciousMetalResponse {
    private Long id;
    private String itemDescription;
    private String metalType;
    private BigDecimal weightGrams;
    private String purity;
    private BigDecimal approximateValueInr;
    private BigDecimal estimatedValueInr;
}
