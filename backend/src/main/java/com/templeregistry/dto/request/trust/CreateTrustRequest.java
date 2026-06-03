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

    @NotBlank(message = "Trust name is required")
    @Size(max = 255)
    private String trustName;

    @NotNull(message = "Trust type is required")
    private TrustType trustType;

    @NotBlank(message = "Registration number is required")
    @Size(max = 100)
    @Pattern(regexp = "^[A-Za-z0-9/\\-]+$", message = "Registration number must be alphanumeric")
    private String registrationNumber;

    @NotBlank(message = "Registering authority is required")
    @Size(max = 255)
    private String registeringAuthority;

    @NotNull(message = "Date of registration is required")
    @PastOrPresent(message = "Date of registration cannot be in the future")
    private LocalDate dateOfRegistration;

    @NotBlank(message = "PAN number is required")
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    @NotBlank(message = "Bank account number is required")
    @Pattern(regexp = "^\\d{6,32}$", message = "Bank account must be 6–32 digits")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name is required")
    @Size(max = 255)
    private String bankName;

    @NotBlank(message = "Bank branch is required")
    @Size(max = 255)
    private String bankBranch;

    @PositiveOrZero(message = "Annual income must be zero or positive")
    private BigDecimal annualIncome;
}
