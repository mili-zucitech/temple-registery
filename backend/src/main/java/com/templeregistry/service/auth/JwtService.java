package com.templeregistry.service.auth;

import com.templeregistry.entity.auth.User;
import io.jsonwebtoken.Claims;

import java.time.Duration;
import java.util.Map;

public interface JwtService {

    String generateAccessToken(User user);

    String generateTempToken(User user);

    /**
     * Generate a short-lived, signed JWT for the multi-step registration flow.
     * The JWT carries opaque phase metadata; it never contains a raw Aadhaar number.
     *
     * @param claims  Custom claims to embed (e.g. reg_phase, aadhaar_hash, mobile)
     * @param ttl     Token time-to-live
     * @return        Signed RS256 JWT string
     */
    String generateRegistrationToken(Map<String, Object> claims, Duration ttl);

    Claims validateAndParse(String token);

    String generateRefreshToken();
}
