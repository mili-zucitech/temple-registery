package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.AadhaarVerifyRequest;
import com.templeregistry.dto.request.auth.RegistrationInitRequest;
import com.templeregistry.dto.response.auth.AadhaarOtpResponse;
import com.templeregistry.dto.response.auth.RegistrationInitResponse;
import com.templeregistry.exception.AadhaarVerificationException;
import com.templeregistry.service.auth.AadhaarService;
import com.templeregistry.service.auth.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;

/**
 * Mock Aadhaar eKYC service for development.
 * In production: replace with UIDAI eKYC API integration.
 *
 * Accepted mock values (dev only):
 *   Aadhaar: 123412341234
 *   OTP:     999999
 *
 * Security: the raw Aadhaar number is NEVER stored. Only its SHA-256 hash
 * is embedded in the registration JWT claim for round-trip verification.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AadhaarServiceImpl implements AadhaarService {

    /** Dev-only accepted Aadhaar number. Never store in DB. */
    private static final String MOCK_AADHAAR       = "123412341234";
    /** Dev-only accepted OTP. */
    private static final String MOCK_OTP           = "999999";
    /** JWT claim: registration phase marker. */
    private static final String CLAIM_REG_PHASE    = "reg_phase";
    /** JWT claim: SHA-256 hash of the Aadhaar (never the raw number). */
    private static final String CLAIM_AADHAAR_HASH = "aadhaar_hash";
    /** JWT claim: mobile supplied at init. */
    private static final String CLAIM_MOBILE       = "mobile";

    private static final String PHASE_OTP_SENT          = "OTP_SENT";
    private static final String PHASE_AADHAAR_VERIFIED  = "AADHAAR_VERIFIED";

    private final JwtService jwtService;

    @Override
    public RegistrationInitResponse initRegistration(RegistrationInitRequest request) {
        // Mock guard: only the designated test Aadhaar is accepted in dev mode.
        if (!MOCK_AADHAAR.equals(request.getAadhaar())) {
            // Intentionally generic message — do not confirm whether the Aadhaar exists.
            throw new AadhaarVerificationException("Aadhaar verification service unavailable. Please try again later.");
        }

        String aadhaarHash = sha256Hex(request.getAadhaar());
        String maskedAadhaar = "XXXX-XXXX-" + request.getAadhaar().substring(8);

        // Log only last 4 digits — never log the full Aadhaar (SC-05)
        log.info("Aadhaar OTP initiated for Aadhaar ending [{}]", request.getAadhaar().substring(8));

        String tempToken = jwtService.generateRegistrationToken(
                Map.of(
                        CLAIM_REG_PHASE,    PHASE_OTP_SENT,
                        CLAIM_AADHAAR_HASH, aadhaarHash,
                        CLAIM_MOBILE,       request.getMobile()
                ),
                Duration.ofMinutes(5)
        );

        return RegistrationInitResponse.builder()
                .tempToken(tempToken)
                .maskedAadhaar(maskedAadhaar)
                .message("OTP sent to the mobile number linked with your Aadhaar. Valid for 5 minutes.")
                .build();
    }

    @Override
    public AadhaarOtpResponse verifyAadhaar(AadhaarVerifyRequest request) {
        Claims claims = parseTempToken(request.getTempToken());

        String storedPhase = claims.get(CLAIM_REG_PHASE, String.class);
        if (!PHASE_OTP_SENT.equals(storedPhase)) {
            throw new AadhaarVerificationException("Invalid registration token phase. Please restart registration.");
        }

        String storedAadhaarHash  = claims.get(CLAIM_AADHAAR_HASH, String.class);
        String submittedAadhaarHash = sha256Hex(request.getAadhaar());
        if (!MessageDigest.isEqual(storedAadhaarHash.getBytes(StandardCharsets.UTF_8),
                                   submittedAadhaarHash.getBytes(StandardCharsets.UTF_8))) {
            throw new AadhaarVerificationException("Aadhaar number does not match the registration session.");
        }

        // Mock OTP check — constant-time compare via MessageDigest.isEqual prevents timing attacks
        if (!MessageDigest.isEqual(MOCK_OTP.getBytes(StandardCharsets.UTF_8),
                                   request.getOtp().getBytes(StandardCharsets.UTF_8))) {
            throw new AadhaarVerificationException("Invalid OTP. Please try again.");
        }

        String mobile = claims.get(CLAIM_MOBILE, String.class);

        String verifiedToken = jwtService.generateRegistrationToken(
                Map.of(
                        CLAIM_REG_PHASE,    PHASE_AADHAAR_VERIFIED,
                        CLAIM_AADHAAR_HASH, storedAadhaarHash,
                        CLAIM_MOBILE,       mobile != null ? mobile : ""
                ),
                Duration.ofMinutes(10)
        );

        log.info("Aadhaar OTP verified for Aadhaar ending [{}]", request.getAadhaar().substring(8));

        return AadhaarOtpResponse.builder()
                .verificationToken(verifiedToken)
                .message("Aadhaar verified successfully. Proceed to account creation.")
                .build();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Claims parseTempToken(String token) {
        try {
            return jwtService.validateAndParse(token);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new AadhaarVerificationException("Registration token is invalid or has expired. Please restart registration.");
        }
    }

    /**
     * SHA-256 hash of a string, returned as lowercase hex.
     * Used to embed a non-reversible fingerprint of the Aadhaar in the JWT
     * without ever storing the raw number (SC-05).
     */
    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 is guaranteed by the JVM spec; this branch is unreachable.
            throw new IllegalStateException("SHA-256 algorithm not available", ex);
        }
    }
}
