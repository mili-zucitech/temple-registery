package com.templeregistry.security;

import com.templeregistry.exception.JurisdictionAccessDeniedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.*;

class OwnershipGuardTest {

    private final OwnershipGuard guard = new OwnershipGuard();

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    private void setAuthenticatedClaims(ScopeHelper.Claims claims) {
        var auth = new UsernamePasswordAuthenticationToken(claims, null, java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void setAnonymous() {
        var auth = new UsernamePasswordAuthenticationToken("anonymousUser", null, java.util.List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void should_allow_when_anonymous_assertOwnsTemple() {
        setAnonymous();
        // Anonymous users can reach read endpoints; guard must not throw
        assertThatCode(() -> guard.assertOwnsTemple(10L)).doesNotThrowAnyException();
    }

    @Test
    void should_allow_when_SA_assertOwnsTemple() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user", "EDIT"));
        assertThatCode(() -> guard.assertOwnsTemple(10L)).doesNotThrowAnyException();
    }

    @Test
    void should_allow_when_TA_ownsTemple() {
        setAuthenticatedClaims(new ScopeHelper.Claims(2L, RoleConstants.TEMPLE_AUTHORITY, null, 10L, "ta_user", "EDIT"));
        assertThatCode(() -> guard.assertOwnsTemple(10L)).doesNotThrowAnyException();
    }

    @Test
    void should_throw_when_TA_doesNotOwnTemple() {
        setAuthenticatedClaims(new ScopeHelper.Claims(2L, RoleConstants.TEMPLE_AUTHORITY, null, 10L, "ta_user", "EDIT"));
        assertThatThrownBy(() -> guard.assertOwnsTemple(99L))
                .isInstanceOf(JurisdictionAccessDeniedException.class);
    }

    @Test
    void should_throw_when_TA_and_resourceTempleIdIsNull() {
        setAuthenticatedClaims(new ScopeHelper.Claims(2L, RoleConstants.TEMPLE_AUTHORITY, null, 10L, "ta_user", "EDIT"));
        assertThatThrownBy(() -> guard.assertOwnsTemple(null))
                .isInstanceOf(JurisdictionAccessDeniedException.class);
    }

    @Test
    void should_allow_when_DC_assertOwnsTemple() {
        // DC role: not TEMPLE_AUTHORITY, so ownership check is skipped
        setAuthenticatedClaims(new ScopeHelper.Claims(3L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user", "EDIT"));
        assertThatCode(() -> guard.assertOwnsTemple(10L)).doesNotThrowAnyException();
    }
}
