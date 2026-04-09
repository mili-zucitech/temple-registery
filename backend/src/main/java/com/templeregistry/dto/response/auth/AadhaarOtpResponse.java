package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AadhaarOtpResponse {
    private String verificationToken;  // opaque token returned after OTP verification; submitted with RegisterRequest
    private String message;
}
