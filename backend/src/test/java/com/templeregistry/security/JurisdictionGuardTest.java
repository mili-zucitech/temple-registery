package com.templeregistry.security;

import com.templeregistry.exception.JurisdictionAccessDeniedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.*;

class JurisdictionGuardTest {

    private final JurisdictionGuard guard = new JurisdictionGuard();

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

    // â”€â”€ assertSameDistrict â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Test
    void should_allowAny_when_anonymous_assertSameDistrict() {
        setAnonymous();
        // Should not throw for any districtId
        assertThatCode(() -> guard.assertSameDistrict(99L)).doesNotThrowAnyException();
    }

    @Test
    void should_allow_when_DC_and_sameDistrict() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user", "EDIT"));
        assertThatCode(() -> guard.assertSameDistrict(5L)).doesNotThrowAnyException();
    }

    @Test
    void should_throw_when_DC_and_differentDistrict() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user", "EDIT"));
        assertThatThrownBy(() -> guard.assertSameDistrict(7L))
                .isInstanceOf(JurisdictionAccessDeniedException.class);
    }

    @Test
    void should_allow_when_SA_and_differentDistrict() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user", "EDIT"));
        assertThatCode(() -> guard.assertSameDistrict(7L)).doesNotThrowAnyException();
    }

    // â”€â”€ enforceDistrictId â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    @Test
    void should_returnRequestedDistrictId_when_anonymous_enforceDistrictId() {
        setAnonymous();
        Long result = guard.enforceDistrictId(42L);
        assertThat(result).isEqualTo(42L);
    }

    @Test
    void should_returnJwtDistrictId_when_DC_enforceDistrictId() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user", "EDIT"));
        Long result = guard.enforceDistrictId(99L); // requested a different district
        assertThat(result).isEqualTo(5L); // JWT claim wins
    }

    @Test
    void should_returnRequestedDistrictId_when_SA_enforceDistrictId() {
        setAuthenticatedClaims(new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user", "EDIT"));
        Long result = guard.enforceDistrictId(77L);
        assertThat(result).isEqualTo(77L);
    }

    @Test
    void should_returnRequestedDistrictId_when_DCStaff_uses_ownDistrict() {
        setAuthenticatedClaims(new ScopeHelper.Claims(2L, RoleConstants.DC_STAFF, 3L, null, "dc_staff", "EDIT"));
        Long result = guard.enforceDistrictId(10L); // requested another, but JWT wins
        assertThat(result).isEqualTo(3L);
    }
}
