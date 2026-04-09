package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;
import com.templeregistry.service.auth.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
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
}
