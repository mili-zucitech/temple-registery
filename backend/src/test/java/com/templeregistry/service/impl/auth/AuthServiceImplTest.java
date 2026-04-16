package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.request.auth.LoginRequest;
import com.templeregistry.dto.response.auth.AuthTokenResponse;
import com.templeregistry.dto.response.auth.MfaChallengeResponse;
import com.templeregistry.entity.auth.MfaType;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.exception.AccountLockedException;
import com.templeregistry.repository.auth.RefreshTokenRepository;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.service.auth.JwtService;
import com.templeregistry.service.auth.MfaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock MfaService mfaService;

    @InjectMocks AuthServiceImpl authService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .username("dcuser").passwordHash("hashed")
                .role(UserRole.DISTRICT_COLLECTOR).mfaType(MfaType.NONE)
                .isActive(true).failedLoginCount(0).build();
    }

    @Test
    void should_throw_AccountLocked_when_user_is_locked() {
        activeUser.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByUsername("dcuser")).thenReturn(Optional.of(activeUser));

        LoginRequest rq = new LoginRequest("dcuser", "correct");
        assertThatThrownBy(() -> authService.login(rq))
                .isInstanceOf(AccountLockedException.class);
    }

    @Test
    void should_increment_failedLoginCount_when_wrong_password() {
        when(userRepository.findByUsername("dcuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        LoginRequest rq = new LoginRequest("dcuser", "wrong");
        assertThatThrownBy(() -> authService.login(rq))
                .isInstanceOf(com.templeregistry.exception.EntityNotFoundException.class);

        verify(userRepository).save(argThat(u -> u.getFailedLoginCount() == 1));
    }

    @Test
    void should_issue_token_pair_when_mfa_is_none() {
        when(userRepository.findByUsername("dcuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken()).thenReturn("refresh-token");

        Object result = authService.login(new LoginRequest("dcuser", "correct"));

        assertThat(result).isInstanceOf(AuthTokenResponse.class);
        assertThat(((AuthTokenResponse) result).getAccessToken()).isEqualTo("access-token");
    }

    @Test
    void should_issue_mfa_challenge_when_mfa_is_totp() {
        activeUser.setMfaType(MfaType.TOTP);
        when(userRepository.findByUsername("dcuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "hashed")).thenReturn(true);
        when(jwtService.generateTempToken(any())).thenReturn("temp-token");

        Object result = authService.login(new LoginRequest("dcuser", "correct"));

        assertThat(result).isInstanceOf(MfaChallengeResponse.class);
        assertThat(((MfaChallengeResponse) result).getTempToken()).isEqualTo("temp-token");
    }

    @Test
    void should_lock_account_after_five_failed_attempts() {
        activeUser.setFailedLoginCount(4);
        when(userRepository.findByUsername("dcuser")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(any(), any())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("dcuser", "bad")))
                .isInstanceOf(com.templeregistry.exception.EntityNotFoundException.class);

        verify(userRepository).save(argThat(u -> u.getLockedUntil() != null));
    }
}
