package com.templeregistry.controller.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.auth.*;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.UserProfileResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.auth.AuthService;
import com.templeregistry.service.auth.UserProfileService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = AuthController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean ScopeHelper scopeHelper;
    @MockBean AuthService authService;
    @MockBean UserProfileService userProfileService;

    // ── POST /api/v1/auth/login ─────────────────────────────────────────────

    @Nested
    class Login {

        @Test
        void should_return200_when_loginSucceedsWithFullToken() throws Exception {
            AuthTokenResponse tokens = AuthTokenResponse.builder()
                .accessToken("access.jwt.token")
                .refreshToken("refresh-token-hex")
                .expiresIn(3600)
                .role("TEMPLE_AUTHORITY")
                .userId(10L)
                .build();
            when(authService.login(any())).thenReturn(tokens);

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new LoginRequest("user1", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Authentication successful."));
        }

        @Test
        void should_return200WithMfaChallenge_when_loginRequiresMfa() throws Exception {
            // Service returns something other than AuthTokenResponse (e.g. a Map)
            when(authService.login(any())).thenReturn(java.util.Map.of("type", "TOTP_REQUIRED", "tempToken", "temp.token"));

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new LoginRequest("user1", "password123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("MFA challenge issued."));
        }

        @Test
        void should_return400_when_loginRequestMissingUsername() throws Exception {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"\",\"password\":\"password123\"}"))
                .andExpect(status().isBadRequest());
        }

        @Test
        void should_return400_when_loginRequestMissingPassword() throws Exception {
            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"username\":\"admin\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());
        }
    }

    // ── POST /api/v1/auth/mfa-verify ────────────────────────────────────────

    @Nested
    class MfaVerify {

        @Test
        void should_return200AndSetCookies_when_mfaCodeValid() throws Exception {
            AuthTokenResponse tokens = AuthTokenResponse.builder()
                .accessToken("access.jwt.token")
                .refreshToken("refresh-token-hex")
                .expiresIn(3600)
                .role("DISTRICT_COLLECTOR")
                .userId(5L)
                .build();
            when(authService.verifyMfa(any())).thenReturn(tokens);

            mockMvc.perform(post("/api/v1/auth/mfa-verify")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"tempToken\":\"temp.token\",\"mfaCode\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Authentication successful."));
        }
    }

    // ── POST /api/v1/auth/refresh ────────────────────────────────────────────

    @Nested
    class Refresh {

        @Test
        void should_return401_when_noRefreshTokenCookie() throws Exception {
            mockMvc.perform(post("/api/v1/auth/refresh"))
                .andExpect(status().isUnauthorized());
        }

        @Test
        void should_return200_when_refreshTokenCookiePresent() throws Exception {
            AuthTokenResponse tokens = AuthTokenResponse.builder()
                .accessToken("new.access.jwt")
                .refreshToken("new-refresh-hex")
                .expiresIn(3600)
                .role("SUPER_ADMIN")
                .userId(1L)
                .build();
            when(authService.refresh(anyString())).thenReturn(tokens);

            mockMvc.perform(post("/api/v1/auth/refresh")
                    .cookie(new jakarta.servlet.http.Cookie("refresh_token", "valid-refresh-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Token refreshed."));
        }
    }

    // ── POST /api/v1/auth/logout ─────────────────────────────────────────────

    @Nested
    class Logout {

        @Test
        void should_return200_when_logoutCalledWithoutCookie() throws Exception {
            mockMvc.perform(post("/api/v1/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Logged out successfully."));
            verify(authService, never()).logout(anyString());
        }

        @Test
        void should_revokeRefreshToken_when_cookiePresentOnLogout() throws Exception {
            mockMvc.perform(post("/api/v1/auth/logout")
                    .cookie(new jakarta.servlet.http.Cookie("refresh_token", "some-refresh-token")))
                .andExpect(status().isOk());
            verify(authService).logout("some-refresh-token");
        }
    }

    // ── GET /api/v1/auth/me ──────────────────────────────────────────────────

    @Nested
    class Me {

        @Test
        void should_return200WithProfile_when_userAuthenticated() throws Exception {
            UserProfileResponse profile = UserProfileResponse.builder()
                .username("testuser")
                .email("test@example.com")
                .role(UserRole.TEMPLE_AUTHORITY)
                .fullName("Test User")
                .build();
            when(userProfileService.getCurrentUserProfile()).thenReturn(profile);

            mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("testuser"));
        }

        @Test
        void should_returnProfile_when_getCurrentUserProfileCalled() throws Exception {
            mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk());
        }
    }

    // ── POST /api/v1/auth/password-reset-req ────────────────────────────────

    @Nested
    class PasswordResetRequest {

        @Test
        void should_return200_when_passwordResetRequested() throws Exception {
            doNothing().when(authService).requestPasswordReset(any());

            mockMvc.perform(post("/api/v1/auth/password-reset-req")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"email\":\"user@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }
    }
}
