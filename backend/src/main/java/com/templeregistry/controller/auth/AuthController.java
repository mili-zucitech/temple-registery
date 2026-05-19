package com.templeregistry.controller.auth;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.request.auth.*;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.UserProfileResponse;
import com.templeregistry.service.auth.AuthService;
import com.templeregistry.service.auth.UserProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, MFA, token refresh, and logout endpoints")
public class AuthController {

    private static final int ACCESS_MAX_AGE  = 2 * 60 * 60;    // 2 hours
    private static final int REFRESH_MAX_AGE = 7 * 24 * 3600;  // 7 days

    private final AuthService authService;
    private final UserProfileService userProfileService;
    private final Environment environment;

    @PostMapping("/login")
    @Operation(summary = "Step 1: Authenticate with username+password. Returns MFA challenge or sets auth cookies directly when MFA is disabled.")
    public ResponseEntity<ApiResponse<?>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        Object result = authService.login(request);
        if (result instanceof AuthTokenResponse tokens) {
            setAuthCookies(httpResponse, tokens);
            return ResponseEntity.ok(ApiResponse.success("Authentication successful.", sanitize(tokens)));
        }
        return ResponseEntity.ok(ApiResponse.success("MFA challenge issued.", result));
    }

    @PostMapping("/mfa-verify")
    @Operation(summary = "Step 2: Submit MFA code; sets httpOnly auth cookies on success.")
    public ResponseEntity<ApiResponse<?>> verifyMfa(
            @Valid @RequestBody MfaVerifyRequest request,
            HttpServletResponse httpResponse) {
        AuthTokenResponse tokens = authService.verifyMfa(request);
        setAuthCookies(httpResponse, tokens);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful.", sanitize(tokens)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token via httpOnly cookie; sets new auth cookies.")
    public ResponseEntity<ApiResponse<?>> refresh(
            HttpServletRequest request, HttpServletResponse httpResponse) {
        String refreshToken = readCookie(request, "refresh_token");
        if (refreshToken == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("No refresh token provided.", "UNAUTHORIZED"));
        }
        AuthTokenResponse tokens = authService.refresh(refreshToken);
        setAuthCookies(httpResponse, tokens);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed.", sanitize(tokens)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke the refresh token and clear auth cookies.")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request, HttpServletResponse httpResponse) {
        String refreshToken = readCookie(request, "refresh_token");
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        clearAuthCookies(httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user''s profile.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved.",
                userProfileService.getCurrentUserProfile()));
    }

    @PostMapping("/password-reset-req")
    @Operation(summary = "Request a password reset email.")
    public ResponseEntity<ApiResponse<Void>> passwordResetRequest(
            @Valid @RequestBody PasswordResetRequest request) {
        authService.requestPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If the email is registered, a reset link has been sent."));
    }

    @PostMapping("/password-reset")
    @Operation(summary = "Complete password reset with token and new password.")
    public ResponseEntity<ApiResponse<Void>> passwordReset(
            @Valid @RequestBody PasswordResetConfirmRequest request) {
        authService.confirmPasswordReset(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successfully."));
    }

    //  Cookie helpers 

    private void setAuthCookies(HttpServletResponse response, AuthTokenResponse tokens) {
        clearLegacyAuthCookies(response);
        addCookie(response, "access_token",  tokens.getAccessToken(),  "/api",                ACCESS_MAX_AGE);
        addCookie(response, "refresh_token", tokens.getRefreshToken(), "/api/v1/auth/refresh", REFRESH_MAX_AGE);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        clearLegacyAuthCookies(response);
        addCookie(response, "access_token",  "", "/api",                0);
        addCookie(response, "refresh_token", "", "/api/v1/auth/refresh", 0);
    }

    private void clearLegacyAuthCookies(HttpServletResponse response) {
        // Backward compatibility: previous builds used wider cookie paths.
        // Clear them on every login/refresh/logout so stale role tokens cannot leak across sessions.
        addCookie(response, "access_token", "", "/", 0);
        addCookie(response, "access_token", "", "/api/v1", 0);
        addCookie(response, "refresh_token", "", "/", 0);
        addCookie(response, "refresh_token", "", "/api/v1", 0);
    }

    private void addCookie(HttpServletResponse response, String name, String value,
                           String path, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(true);
        cookie.setSecure(!environment.acceptsProfiles(Profiles.of("dev", "local")));
        cookie.setPath(path);
        cookie.setMaxAge(maxAge);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(StringUtils::hasText)
                .findFirst().orElse(null);
    }

    /** Strip raw tokens from the body; expose only metadata to the client. */
    private AuthTokenResponse sanitize(AuthTokenResponse r) {
        return AuthTokenResponse.builder()
                .userId(r.getUserId())
                .role(r.getRole())
                .expiresIn(r.getExpiresIn())
                .build();
    }
}