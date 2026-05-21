package com.templeregistry.security;

import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.repository.auth.UserRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserDetailsServiceImpl service;

    private User activeUser(String username) {
        User u = new User();
        u.setUsername(username);
        u.setPasswordHash("$2a$10$hashedpassword");
        u.setRole(UserRole.TEMPLE_AUTHORITY);
        u.setActive(true);
        return u;
    }

    private User lockedUser(String username) {
        User u = activeUser(username);
        u.setLockedUntil(LocalDateTime.now().plusHours(1));
        return u;
    }

    private User inactiveUser(String username) {
        User u = activeUser(username);
        u.setActive(false);
        return u;
    }

    @Nested
    class LoadUserByUsername {

        @Test
        void should_returnUserDetails_when_userExists() {
            when(userRepository.findByUsername("ta_user")).thenReturn(Optional.of(activeUser("ta_user")));

            UserDetails details = service.loadUserByUsername("ta_user");

            assertThat(details.getUsername()).isEqualTo("ta_user");
            assertThat(details.isEnabled()).isTrue();
            assertThat(details.isAccountNonLocked()).isTrue();
            assertThat(details.getAuthorities()).anyMatch(a -> a.getAuthority().equals("ROLE_TEMPLE_AUTHORITY"));
        }

        @Test
        void should_returnLockedAccount_when_userIsLocked() {
            when(userRepository.findByUsername("locked")).thenReturn(Optional.of(lockedUser("locked")));

            UserDetails details = service.loadUserByUsername("locked");

            assertThat(details.isAccountNonLocked()).isFalse();
        }

        @Test
        void should_returnDisabledAccount_when_userIsInactive() {
            when(userRepository.findByUsername("inactive")).thenReturn(Optional.of(inactiveUser("inactive")));

            UserDetails details = service.loadUserByUsername("inactive");

            assertThat(details.isEnabled()).isFalse();
        }

        @Test
        void should_throwUsernameNotFoundException_when_userNotFound() {
            when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.loadUserByUsername("unknown"))
                    .isInstanceOf(UsernameNotFoundException.class)
                    .hasMessageContaining("unknown");
        }
    }
}
