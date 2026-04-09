package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.RefreshToken;
import com.templeregistry.entity.auth.User;
import com.templeregistry.exception.AccountLockedException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.MfaVerificationException;
import com.templeregistry.repository.auth.RefreshTokenRepository;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.security.TokenRevocationGuard;
import com.templeregistry.service.auth.AuthService;
import com.templeregistry.service.auth.JwtService;
import com.templeregistry.service.auth.MfaService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MfaService mfaService;
    private final TokenRevocationGuard tokenRevocationGuard;

    @Value("${app.jwt.refresh-token-expiry-days:7}")
    private int refreshTokenExpiryDays;

    @Override
    @Transactional
    public MfaChallengeResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new EntityNotFoundException("Invalid credentials.", "INVALID_CREDENTIALS"));

        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new AccountLockedException(
                    user.getLockedUntil().toEpochSecond(java.time.ZoneOffset.UTC));
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginCount() + 1;
            user.setFailedLoginCount(attempts);
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                log.warn("Account locked for user [{}] after {} failed attempts", user.getId(), attempts);
            }
            userRepository.save(user);
            throw new EntityNotFoundException("Invalid credentials.", "INVALID_CREDENTIALS");
        }

        user.setFailedLoginCount(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String tempToken = jwtService.generateTempToken(user);
        String challengeType = user.getMfaType() == MfaType.SMS_OTP ? "SMS_OTP" : "TOTP";

        if (user.getMfaType() == MfaType.SMS_OTP) {
            mfaService.sendSmsOtp(user.getMobile());
        }

        return MfaChallengeResponse.builder()
                .mfaRequired(user.getMfaType() != MfaType.NONE)
                .challengeType(challengeType)
                .tempToken(tempToken)
                .build();
    }

    @Override
    @Transactional
    public AuthTokenResponse verifyMfa(MfaVerifyRequest request) {
        Claims claims = jwtService.validateAndParse(request.getTempToken());
        String username = claims.getSubject();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found.", "USER_NOT_FOUND"));

        if (user.getMfaType() == MfaType.TOTP) {
            mfaService.verifyTotp(user.getMfaSecret(), request.getMfaCode());
        } else if (user.getMfaType() == MfaType.SMS_OTP) {
            mfaService.verifySmsOtp(username, request.getMfaCode());
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return issueTokenPair(user);
    }

    @Override
    @Transactional
    public AuthTokenResponse refresh(RefreshTokenRequest request) {
        String tokenHash = sha256(request.getRefreshToken());
        tokenRevocationGuard.assertNotRevoked(tokenHash);

        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new SecurityException("Refresh token not found."));

        // Rotate: revoke the old token
        storedToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(storedToken);

        return issueTokenPair(storedToken.getUser());
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        String tokenHash = sha256(refreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
            rt.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(rt);
            log.info("User [{}] logged out", rt.getUser().getId());
        });
    }

    @Override
    @Transactional
    public void requestPasswordReset(PasswordResetRequest request) {
        // In production: generate a signed reset token, store its hash, and send email
        // Not logging the email to avoid PII in logs
        userRepository.findByEmail(request.getEmail()).ifPresent(user ->
                log.info("Password reset requested for user [{}]", user.getId()));
    }

    @Override
    @Transactional
    public void confirmPasswordReset(PasswordResetConfirmRequest request) {
        // TODO: Validate the reset token, update password hash, revoke all refresh tokens
        throw new UnsupportedOperationException("Password reset flow not yet implemented.");
    }

    private AuthTokenResponse issueTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();
        String tokenHash = sha256(rawRefreshToken);

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .build();
        refreshTokenRepository.save(rt);

        return AuthTokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .expiresIn(900)
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    private String sha256(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available.", e);
        }
    }
}
