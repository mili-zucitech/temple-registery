package com.templeregistry.service.auth;

import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.request.auth.AadhaarOtpRequest;
import com.templeregistry.dto.request.auth.RegisterRequest;

public interface RegistrationService {

    AadhaarOtpResponse requestAadhaarOtp(AadhaarOtpRequest request);

    AadhaarOtpResponse verifyAadhaarOtp(AadhaarOtpRequest request, String otp);

    void register(RegisterRequest request);
}
