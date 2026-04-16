package com.templeregistry.dto.request.trust;

import com.templeregistry.entity.trust.TrustType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class UpdateTrustRequest {
    @NotBlank(message = "Trust name is required")
    @Size(max = 255)
    private String trustName;

    @NotBlank(message = "Trust registration number is required")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "Trust registration number must be alphanumeric")
    @Size(max = 100)
    private String trustRegistrationNumber;

    @NotNull(message = "Date of registration is required")
    private LocalDate dateOfRegistration;

    @NotBlank(message = "Registering authority is required")
    @Size(max = 255)
    private String registeringAuthority;

    @NotNull(message = "Trust type is required")
    private TrustType trustType;

    // PAN should NOT change after creation (immutable) - not included here

    @NotBlank(message = "Bank account number is required")
    @Pattern(regexp = "^[0-9]{9,18}$", message = "Bank account number must be between 9 and 18 digits")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name and branch is required")
    @Size(max = 255)
    private String bankNameAndBranch;

    @PositiveOrZero(message = "Annual income must be zero or positive")
    private BigDecimal annualIncome;
}
