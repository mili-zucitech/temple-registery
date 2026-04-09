package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class DeclImmovAgriLandResponse {
    private Long id;
    private String surveyNumber;
    private BigDecimal areaAcres;
    private String location;
    private String encumbrance;
    private BigDecimal annualLeaseIncome;
}
