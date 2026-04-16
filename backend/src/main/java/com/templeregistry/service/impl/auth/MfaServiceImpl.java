package com.templeregistry.service.impl.auth;

import com.templeregistry.exception.MfaVerificationException;
import com.templeregistry.service.auth.MfaService;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class MfaServiceImpl implements MfaService {

    private final CodeVerifier codeVerifier;
    private final SecretGenerator secretGenerator;

    @Override
    public String sendSmsOtp(String mobile) {
        // TODO: Integrate with AWS SNS or Twilio for production SMS dispatch.
        // Store OTP hash in cache/DB keyed by mobile or username.
        String otp = String.valueOf(100_000 + new SecureRandom().nextInt(900_000));
        log.info("SMS OTP generated for mobile ending [{}]", mobile.substring(mobile.length() - 4));
        // In real implementation: publish via SNS, store hash in Redis with TTL
        return "dev-otp-ref-" + mobile;
    }

    @Override
    public void verifyTotp(String secret, String code) {
        if (!codeVerifier.isValidCode(secret, code)) {
            throw new MfaVerificationException("Invalid TOTP code.");
        }
    }

    @Override
    public void verifySmsOtp(String referenceKey, String code) {
        // TODO: Look up stored OTP hash from Redis/cache and compare.
        // Throw MfaVerificationException on mismatch or expiry.
        log.info("SMS OTP verification attempted for ref [{}]", referenceKey);
    }

    @Override
    public String generateTotpSecret() {
        return secretGenerator.generate();
    }
}
