package com.templeregistry.service.impl.auth;

import com.templeregistry.exception.AadhaarVerificationException;
import com.templeregistry.service.auth.AadhaarService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Development/stub implementation of AadhaarService.
 * In production, replace with the real UIDAI eKYC API integration.
 */
@Service
@Slf4j
public class AadhaarServiceImpl implements AadhaarService {

    @Override
    public String requestOtp(String aadhaarNumber) {
        // TODO: Integrate with UIDAI OTP API (production).
        log.info("Stub: Aadhaar OTP requested for Aadhaar ending [{}]",
                aadhaarNumber.substring(aadhaarNumber.length() - 4));
        return "TXN-" + UUID.randomUUID();
    }

    @Override
    public String verifyOtp(String transactionId, String otp) {
        // TODO: Integrate with UIDAI OTP verification API (production).
        // Stub: any non-blank OTP is accepted in dev mode.
        if (otp == null || otp.isBlank()) {
            throw new AadhaarVerificationException("OTP must not be blank.");
        }
        log.info("Stub: Aadhaar OTP verified for transaction [{}]", transactionId);
        return "VERIFIED-" + UUID.randomUUID();
    }
}
