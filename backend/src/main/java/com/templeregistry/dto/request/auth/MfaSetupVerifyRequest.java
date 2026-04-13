package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Step 5: Verify the OTP sent during MFA setup to enable SMS MFA and
 * generate 8 recovery codes returned once in the response.
 */
@Getter
@NoArgsConstructor
public class MfaSetupVerifyRequest {

    @NotNull(message = "User ID is required.")
    @Positive(message = "User ID must be a positive number.")
    private Long userId;

    @NotBlank(message = "OTP is required.")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits.")
    private String otp;
}
