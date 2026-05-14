package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.MfaSetupRequest;
import com.templeregistry.dto.request.auth.MfaSetupVerifyRequest;
import com.templeregistry.dto.response.auth.MfaSetupVerifyResponse;

public interface MfaService {

    /**
     * Step 4: Initiate SMS MFA setup for a newly registered TEMPLE_AUTHORITY account.
     * Generates a 6-digit OTP, stores its SHA-256 hash in-memory with a 5-minute TTL,
     * and (in dev) logs the OTP instead of dispatching via SMS.
     */
    void setupSmsMfa(MfaSetupRequest request);

    /**
     * Step 5: Verify the OTP from step 4. On success:
     * - enables SMS_OTP MFA on the user record
     * - sets mfa_phone
     * - generates and stores 8 bcrypt-hashed recovery codes
     * - returns the plain recovery codes ONCE
     */
    MfaSetupVerifyResponse verifyAndEnableMfa(MfaSetupVerifyRequest request);

    // ── Existing methods kept for login MFA flow ──────────────────────────────

    /** Generate and send a login-time SMS OTP. Returns an OTP reference key. */
    String sendSmsOtp(String mobile);

    /** Verify a TOTP code against the user's secret. Throws MfaVerificationException on failure. */
    void verifyTotp(String secret, String code);

    /** Verify a login-time SMS OTP given the reference key. Throws MfaVerificationException on failure. */
    void verifySmsOtp(String referenceKey, String code);

    /** Generate a new TOTP secret for user enrollment. */
    String generateTotpSecret();
}
