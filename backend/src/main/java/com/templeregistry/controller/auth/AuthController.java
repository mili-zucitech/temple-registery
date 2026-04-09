package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;
import com.templeregistry.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, MFA, token refresh, and logout endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Step 1: Authenticate with username + password; returns MFA challenge")
    public ResponseEntity<ApiResponse<MfaChallengeResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        MfaChallengeResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("MFA challenge issued.", response));
    }

    @PostMapping("/mfa-verify")
    @Operation(summary = "Step 2: Submit MFA code; returns JWT access + refresh token pair")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request, HttpServletResponse response) {
        AuthTokenResponse tokenResponse = authService.verifyMfa(request);
        setAuthCookies(response, tokenResponse);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful.", tokenResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token; returns new token pair")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(
            HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, "refresh_token");
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("No refresh token.", "UNAUTHORIZED"));
        }
        AuthTokenResponse tokenResponse = authService.refresh(new RefreshTokenRequest(refreshToken));
        setAuthCookies(response, tokenResponse);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed.", tokenResponse));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token (logout)")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = readCookie(request, "refresh_token");
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        clearAuthCookies(response);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
    }

    private void setAuthCookies(HttpServletResponse response, AuthTokenResponse tokens) {
        Cookie accessCookie = new Cookie("access_token", tokens.getAccessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge((int) tokens.getExpiresIn());
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refresh_token", tokens.getRefreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(7 * 24 * 3600);
        response.addCookie(refreshCookie);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        Cookie refreshCookie = new Cookie("refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst().orElse(null);
    }

    @PostMapping("/password-reset-req")
    @Operation(summary = "Request a password reset email")
    public ResponseEntity<ApiResponse<Void>> passwordResetRequest(
            @Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If the email is registered, a reset link has been sent."));
    }

    @PostMapping("/password-reset")
    @Operation(summary = "Complete password reset with token and new password")
    public ResponseEntity<ApiResponse<Void>> passwordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully."));
    }
}
