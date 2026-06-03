package com.templeregistry.dto.response.trust;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class TrustFinancialResponse {
    private Long id;
    private Long trustId;
    private String financialYear;
    private BigDecimal annualIncome;
    private BigDecimal annualExpenditure;
    private LocalDateTime submittedAt;
    private Long documentId;
}
