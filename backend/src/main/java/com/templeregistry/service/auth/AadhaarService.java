package com.templeregistry.service.auth;

public interface AadhaarService {

    /** Request OTP from UIDAI for the given Aadhaar number. Returns a transaction ID. */
    String requestOtp(String aadhaarNumber);

    /** Verify the OTP. Returns an opaque verification token stored for the registration flow. */
    String verifyOtp(String transactionId, String otp);
}
