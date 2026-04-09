package com.templeregistry.security;

import com.templeregistry.repository.auth.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Guards against use of revoked refresh tokens (security control E-01).
 * Checks the refresh_tokens table for revocation before issuing a new token pair.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TokenRevocationGuard {

    private final RefreshTokenRepository refreshTokenRepository;

    public void assertNotRevoked(String tokenHash) {
        refreshTokenRepository.findByTokenHash(tokenHash)
                .ifPresentOrElse(rt -> {
                    if (rt.getRevokedAt() != null) {
                        log.warn("Revoked refresh token used by user [{}]", rt.getUser().getId());
                        throw new SecurityException("Refresh token has been revoked.");
                    }
                    if (rt.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                        throw new SecurityException("Refresh token has expired.");
                    }
                }, () -> {
                    throw new SecurityException("Refresh token not found.");
                });
    }
}
