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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTrustRequest {
    @NotBlank(message = "Trust name is required")
    @Size(max = 255)
    private String trustName;

    @NotBlank(message = "Trust registration number is required")
    @Size(max = 100)
    private String registrationNumber;

    @NotNull(message = "Date of registration is required")
    private LocalDate dateOfRegistration;

    @NotBlank(message = "Registering authority is required")
    @Size(max = 255)
    private String registeringAuthority;

    @NotNull(message = "Trust type is required")
    private TrustType trustType;

    @NotBlank(message = "Bank account number is required")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Bank branch is required")
    private String bankBranch;

    @PositiveOrZero(message = "Annual income must be zero or positive")
    private BigDecimal annualIncome;
}
