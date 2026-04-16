package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

/**
 * Returned from POST /register/init.
 * Contains an opaque RS256-signed tempToken with reg_phase=OTP_SENT.
 * The raw Aadhaar number is never stored or returned.
 */
@Getter
@Builder
public class RegistrationInitResponse {

    private String tempToken;
    private String message;
    private String maskedAadhaar;
}
