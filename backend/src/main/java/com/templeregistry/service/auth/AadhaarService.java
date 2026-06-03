package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.AadhaarVerifyRequest;
import com.templeregistry.dto.request.auth.RegistrationInitRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.response.auth.RegistrationInitResponse;

public interface AadhaarService {

    /**
     * Step 1: Validate Aadhaar (mock: only "123412341234" accepted), generate an OTP,
     * and return a short-lived tempToken (reg_phase=OTP_SENT).
     * Raw Aadhaar is never stored — only its SHA-256 hash is embedded in the JWT claim.
     */
    RegistrationInitResponse initRegistration(RegistrationInitRequest request);

    /**
     * Step 2: Validate the tempToken, confirm mock OTP (must be "999999"),
     * and return a new tempToken (reg_phase=AADHAAR_VERIFIED) valid for 10 minutes.
     */
    AadhaarOtpResponse verifyAadhaar(AadhaarVerifyRequest request);
}
