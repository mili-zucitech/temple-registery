package com.templeregistry.security;

import com.templeregistry.entity.auth.UserAccessType;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class AccessGuardTest {

    private final AccessGuard guard = new AccessGuard();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private void setClaimsInContext(String role, String accessType) {
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, role, 1L, 10L, "user", accessType);
        var auth = new UsernamePasswordAuthenticationToken(claims, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    class AssertCanEdit {

        @Test
        void should_pass_when_templeAuthorityHasEditAccess() {
            setClaimsInContext("TEMPLE_AUTHORITY", UserAccessType.EDIT.name());
            assertThatNoException().isThrownBy(guard::assertCanEdit);
        }

        @Test
        void should_throwAccessDenied_when_templeAuthorityHasViewOnlyAccess() {
            setClaimsInContext("TEMPLE_AUTHORITY", UserAccessType.VIEW.name());
            assertThatThrownBy(guard::assertCanEdit)
                    .isInstanceOf(AccessDeniedException.class)
                    .hasMessageContaining("VIEW-only");
        }

        @Test
        void should_pass_when_roleIsDistrictCollector() {
            setClaimsInContext("DISTRICT_COLLECTOR", UserAccessType.EDIT.name());
            assertThatNoException().isThrownBy(guard::assertCanEdit);
        }

        @Test
        void should_pass_when_roleIsSuperAdmin() {
            setClaimsInContext("SUPER_ADMIN", UserAccessType.EDIT.name());
            assertThatNoException().isThrownBy(guard::assertCanEdit);
        }

        @Test
        void should_pass_when_noAuthenticationInContext() {
            // anonymous — no auth in context, guard should be permissive (blocked at filter level)
            SecurityContextHolder.clearContext();
            assertThatNoException().isThrownBy(guard::assertCanEdit);
        }

        @Test
        void should_pass_when_principalIsNotClaimsType() {
            // Non-Claims principal (e.g. after OAuth etc.)
            var auth = new UsernamePasswordAuthenticationToken("anonymous", null, List.of());
            SecurityContextHolder.getContext().setAuthentication(auth);
            assertThatNoException().isThrownBy(guard::assertCanEdit);
        }
    }
}
