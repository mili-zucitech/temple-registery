package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclMovEquipmentResponse {
    private Long id;
    private String description;
    private Integer quantity;
    private BigDecimal unitValue;
    private BigDecimal totalValue;
}
