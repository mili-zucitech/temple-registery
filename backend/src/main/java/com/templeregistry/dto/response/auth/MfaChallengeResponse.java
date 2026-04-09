package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MfaChallengeResponse {
    private boolean mfaRequired;
    private String challengeType;   // "TOTP" or "SMS_OTP"
    private String tempToken;       // short-lived token to submit MFA answer
}
