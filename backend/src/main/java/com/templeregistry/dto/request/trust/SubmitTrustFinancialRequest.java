package com.templeregistry.dto.request.trust;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.templeregistry.validation.ValidFinancialYear;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class SubmitTrustFinancialRequest {
    @NotBlank(message = "Financial year is required")
    @Size(min = 7, max = 7, message = "Format: YYYY-YY")
    @ValidFinancialYear
    private String financialYear;
    private BigDecimal annualIncome;
    private BigDecimal annualExpenditure;
    private Long documentId;
}
