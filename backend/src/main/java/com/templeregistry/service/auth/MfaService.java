package com.templeregistry.service.auth;

public interface MfaService {

    /** Generate and send an SMS OTP for the given mobile number. Returns the stored OTP reference key. */
    String sendSmsOtp(String mobile);

    /** Verify a TOTP code against the user's secret. Throws MfaVerificationException on failure. */
    void verifyTotp(String secret, String code);

    /** Verify an SMS OTP given the reference key. Throws MfaVerificationException on failure. */
    void verifySmsOtp(String referenceKey, String code);

    /** Generate a new TOTP secret for user enrollment. */
    String generateTotpSecret();
}
