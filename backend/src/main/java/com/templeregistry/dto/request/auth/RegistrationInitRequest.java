package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Step 1 of Temple Authority registration: supply Aadhaar + mobile to receive an OTP.
 * In development, only aadhaar="123412341234" is accepted (mock mode).
 */
@Getter
@NoArgsConstructor
public class RegistrationInitRequest {

    @NotBlank(message = "Aadhaar number is required.")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits.")
    private String aadhaar;

    @NotBlank(message = "Mobile number is required.")
    @Pattern(regexp = "^\\d{10}$", message = "Mobile number must be exactly 10 digits.")
    private String mobile;
}
