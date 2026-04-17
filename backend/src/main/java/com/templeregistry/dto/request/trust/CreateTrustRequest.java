package com.templeregistry.dto.request.trust;

import com.templeregistry.entity.trust.TrustType;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreateTrustRequest {
    @NotBlank @Size(max = 255) private String trustName;
    @NotNull private TrustType trustType;
    @NotBlank @Size(max = 100) private String registrationNumber;
    @Size(max = 255) private String registeringAuthority;
    @NotNull private LocalDate dateOfRegistration;
    @Size(max = 20) private String panNumber;
    private String bankAccountNumber;
    @Size(max = 255) private String bankName;
    @Size(max = 255) private String bankBranch;
    private BigDecimal annualIncome;
}
