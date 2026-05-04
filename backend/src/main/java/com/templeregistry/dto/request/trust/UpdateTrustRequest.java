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

    /** Optional — omit or leave blank to keep the existing PAN on record. */
    @Pattern(regexp = "^$|^[A-Z]{5}[0-9]{4}[A-Z]$", message = "Invalid PAN format (e.g. ABCDE1234F)")
    private String panNumber;

    /** Optional — omit or leave blank to keep the existing bank account on record. */
    @Pattern(regexp = "^$|^\\d{6,32}$", message = "Bank account must be 6–32 digits")
    private String bankAccountNumber;

    @NotBlank(message = "Bank name is required")
    private String bankName;

    @NotBlank(message = "Bank branch is required")
    private String bankBranch;

    @PositiveOrZero(message = "Annual income must be zero or positive")
    private BigDecimal annualIncome;
}
