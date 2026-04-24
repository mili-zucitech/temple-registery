package com.templeregistry.service.auth;

import com.templeregistry.dto.request.auth.CreateAccountRequest;
import com.templeregistry.dto.response.auth.CreateAccountResponse;

public interface RegistrationService {

    /**
     * Step 1: atomically create user + temple, link them, and return the new userId.
     * Accepts Aadhaar number directly (no OTP verification required).
     */
    CreateAccountResponse createAccount(CreateAccountRequest request);
}
