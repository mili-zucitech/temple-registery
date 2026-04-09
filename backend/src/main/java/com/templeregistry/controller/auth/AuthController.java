package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;
import com.templeregistry.dto.response.auth.UserProfileResponse;
import com.templeregistry.service.auth.AuthService;
import com.templeregistry.service.auth.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, MFA, token refresh, and logout endpoints")
public class AuthController {

    private static final String REFRESH_COOKIE = "refreshToken";
    private static final int REFRESH_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

    private final AuthService authService;
    private final UserProfileService userProfileService;

    @PostMapping("/login")
    @Operation(summary = "Step 1: Authenticate with username + password; returns MFA challenge or access token when MFA is disabled")
    public ResponseEntity<ApiResponse<?>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        Object response = authService.login(request);
        if (response instanceof AuthTokenResponse tokenResponse) {
            setRefreshCookie(httpResponse, tokenResponse.getRefreshToken());
            return ResponseEntity.ok(ApiResponse.success("Authentication successful.",
                    sanitize(tokenResponse)));
        }
        return ResponseEntity.ok(ApiResponse.success("MFA challenge issued.", response));
    }

    @PostMapping("/mfa-verify")
    @Operation(summary = "Step 2: Submit MFA code; returns JWT access token")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request,
            HttpServletResponse httpResponse) {
        AuthTokenResponse response = authService.verifyMfa(request);
        setRefreshCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Authentication successful.", sanitize(response)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token via httpOnly cookie; returns new access token")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE) String refreshToken,
            HttpServletResponse httpResponse) {
        AuthTokenResponse response = authService.refresh(refreshToken);
        setRefreshCookie(httpResponse, response.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed.", sanitize(response)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token (logout)")
    public ResponseEntity<ApiResponse<Void>> logout(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
            HttpServletResponse httpResponse) {
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        clearRefreshCookie(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
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

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user's profile and temple completion checklist")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.", userProfileService.getCurrentUserProfile()));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    /** Returns a copy of the response without the raw refresh token in the body. */
    private AuthTokenResponse sanitize(AuthTokenResponse r) {
        return AuthTokenResponse.builder()
                .accessToken(r.getAccessToken())
                .expiresIn(r.getExpiresIn())
                .role(r.getRole())
                .userId(r.getUserId())
                .build();
    }

    private void setRefreshCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(false)          // set true behind HTTPS in production
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(REFRESH_MAX_AGE)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, MFA, token refresh, and logout endpoints")
public class AuthController {

    private final AuthService authService;
    private final UserProfileService userProfileService;

    @PostMapping("/login")
    @Operation(summary = "Step 1: Authenticate with username + password; returns MFA challenge or tokens directly when MFA is disabled")
    public ResponseEntity<ApiResponse<?>> login(
            @Valid @RequestBody LoginRequest request) {
        Object response = authService.login(request);
        boolean isMfaChallenge = response instanceof MfaChallengeResponse;
        String message = isMfaChallenge ? "MFA challenge issued." : "Authentication successful.";
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }

    @PostMapping("/mfa-verify")
    @Operation(summary = "Step 2: Submit MFA code; returns JWT access + refresh token pair")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request) {
        AuthTokenResponse response = authService.verifyMfa(request);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful.", response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token; returns new token pair")
    public ResponseEntity<ApiResponse<AuthTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthTokenResponse response = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed.", response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token (logout)")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
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

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user's profile and temple completion checklist")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.", userProfileService.getCurrentUserProfile()));
    }
}
