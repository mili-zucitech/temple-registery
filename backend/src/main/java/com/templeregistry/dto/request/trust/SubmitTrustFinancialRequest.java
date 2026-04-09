package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Getter @NoArgsConstructor
public class SubmitTrustFinancialRequest {
    @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Format: YYYY-YY") private String financialYear;
    private BigDecimal annualIncome;
    private BigDecimal annualExpenditure;
    private Long documentId;
}
