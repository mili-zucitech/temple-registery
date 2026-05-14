package com.templeregistry.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Step 2: Verify the mocked Aadhaar OTP.
 * In development: otp must be "999999" and aadhaar must be "123412341234".
 * The tempToken received from /register/init is required to tie the session together.
 */
@Getter
@NoArgsConstructor
public class AadhaarVerifyRequest {

    @NotBlank(message = "Aadhaar number is required.")
    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits.")
    private String aadhaar;

    @NotBlank(message = "OTP is required.")
    @Pattern(regexp = "^\\d{6}$", message = "OTP must be exactly 6 digits.")
    private String otp;

    @NotBlank(message = "Temp token from registration init is required.")
    private String tempToken;
}
