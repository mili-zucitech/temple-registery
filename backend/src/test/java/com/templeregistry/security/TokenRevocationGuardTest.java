package com.templeregistry.security;

import com.templeregistry.entity.auth.RefreshToken;
import com.templeregistry.entity.auth.User;
import com.templeregistry.repository.auth.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TokenRevocationGuardTest {

    @Mock RefreshTokenRepository refreshTokenRepository;
    @InjectMocks TokenRevocationGuard guard;

    private static final String VALID_HASH = "valid-hash-abc";

    private User stubUser() {
        User u = new User();
        u.setId(1L);
        return u;
    }

    @Nested
    class AssertNotRevoked {

        @Test
        void should_pass_when_tokenIsActiveAndNotExpired() {
            RefreshToken rt = RefreshToken.builder()
                    .tokenHash(VALID_HASH)
                    .user(stubUser())
                    .revokedAt(null)
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();
            when(refreshTokenRepository.findByTokenHash(VALID_HASH)).thenReturn(Optional.of(rt));

            assertThatNoException().isThrownBy(() -> guard.assertNotRevoked(VALID_HASH));
        }

        @Test
        void should_throwSecurityException_when_tokenIsRevoked() {
            RefreshToken rt = RefreshToken.builder()
                    .tokenHash(VALID_HASH)
                    .user(stubUser())
                    .revokedAt(LocalDateTime.now().minusMinutes(5))
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .build();
            when(refreshTokenRepository.findByTokenHash(VALID_HASH)).thenReturn(Optional.of(rt));

            assertThatThrownBy(() -> guard.assertNotRevoked(VALID_HASH))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("revoked");
        }

        @Test
        void should_throwSecurityException_when_tokenIsExpired() {
            RefreshToken rt = RefreshToken.builder()
                    .tokenHash(VALID_HASH)
                    .user(stubUser())
                    .revokedAt(null)
                    .expiresAt(LocalDateTime.now().minusHours(1))
                    .build();
            when(refreshTokenRepository.findByTokenHash(VALID_HASH)).thenReturn(Optional.of(rt));

            assertThatThrownBy(() -> guard.assertNotRevoked(VALID_HASH))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("expired");
        }

        @Test
        void should_throwSecurityException_when_tokenNotFound() {
            when(refreshTokenRepository.findByTokenHash("missing-hash")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> guard.assertNotRevoked("missing-hash"))
                    .isInstanceOf(SecurityException.class)
                    .hasMessageContaining("not found");
        }
    }
}
