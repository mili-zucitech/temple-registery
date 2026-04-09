package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Builder
public class DeclImmovLeasedResponse {
    private Long id;
    private String lesseeName;
    private LocalDate leaseExpiry;
    private BigDecimal annualRent;
}
