package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.AadhaarVerifyRequest;
import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.request.auth.RegistrationInitRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.response.auth.CreateAccountResponse;
import com.templeregistry.dto.response.auth.RegistrationInitResponse;

public interface RegistrationService {

    /** Step 1: initiate Aadhaar OTP (returns tempToken with reg_phase=OTP_SENT). */
    RegistrationInitResponse initRegistration(RegistrationInitRequest request);

    /** Step 2: verify mock Aadhaar OTP (returns tempToken with reg_phase=AADHAAR_VERIFIED). */
    AadhaarOtpResponse verifyAadhaar(AadhaarVerifyRequest request);

    /**
     * Step 3: atomically create user + temple, link them, and return the new userId.
     * Validates the AADHAAR_VERIFIED tempToken before proceeding.
     */
    CreateAccountResponse createAccount(CreateAccountRequest request);
}
