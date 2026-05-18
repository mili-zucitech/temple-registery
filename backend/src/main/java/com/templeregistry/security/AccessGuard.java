package com.templeregistry.security;

import com.templeregistry.entity.auth.UserAccessType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Enforces the VIEW / EDIT access-type constraint for TEMPLE_AUTHORITY users.
 *
 * <p>A TEMPLE_AUTHORITY user with {@code access_type = VIEW} is permitted to log in and
 * browse their temple's data but must not be able to mutate it (create/update drafts,
 * submit for review, upload documents). Call {@link #assertCanEdit()} at the start of
 * every write method that a TA may reach.</p>
 *
 * <p>All other roles always pass the guard — access_type enforcement is TA-scoped.</p>
 */
@Component
public class AccessGuard {

    /**
     * Throws {@link AccessDeniedException} if the current principal is a
     * TEMPLE_AUTHORITY user whose {@code access_type} is {@code VIEW}.
     */
    public void assertCanEdit() {
        ScopeHelper.Claims claims = currentClaimsOrNull();
        if (claims == null) return; // anonymous — blocked earlier by filter chain

        if (RoleConstants.TEMPLE_AUTHORITY.equals(claims.role())
                && UserAccessType.VIEW.name().equals(claims.accessType())) {
            throw new AccessDeniedException(
                    "Your account is configured for VIEW-only access. "
                    + "Contact your administrator to request edit permissions.");
        }
    }

    private ScopeHelper.Claims currentClaimsOrNull() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        return (principal instanceof ScopeHelper.Claims c) ? c : null;
    }
}
