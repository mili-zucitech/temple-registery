package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class SubmitTrustFinancialRequest {
    @NotBlank @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Format: YYYY-YY") private String financialYear;
    private BigDecimal annualIncome;
    private BigDecimal annualExpenditure;
    private Long documentId;
}
