package com.templeregistry.dto.response.auth;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Returned from POST /mfa/verify (step 5).
 * Recovery codes are shown ONCE; they must never be stored plaintext server-side.
 * Format per spec: XXXX-XXXX-XX (10 alphanumeric characters + 2 hyphens = 12 chars total).
 */
@Getter
@Builder
public class MfaSetupVerifyResponse {

    private String message;
    private Long userId;

    /**
     * 8 single-use recovery codes returned in plain-text form exactly once.
     * Each code is independently bcrypt-hashed (cost=12) and stored in mfa_recovery_codes.
     */
    private List<String> recoveryCodes;
}
