package com.templeregistry.security;

import com.templeregistry.exception.JurisdictionAccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Enforces temple ownership for TEMPLE_AUTHORITY role.
 * A temple authority may only access and mutate data belonging to their own temple.
 */
@Component
public class OwnershipGuard {

    public void assertOwnsTemple(Long resourceTempleId) {
        ScopeHelper.Claims claims = currentClaimsOrNull();
        if (claims == null) return; // anonymous: no ownership restriction (only reaches read endpoints)
        if (RoleConstants.TEMPLE_AUTHORITY.equals(claims.role())) {
            if (resourceTempleId == null || claims.templeId() == null
                    || !resourceTempleId.equals(claims.templeId())) {
                throw new JurisdictionAccessDeniedException(
                        "You are not authorized to access temple [" + resourceTempleId + "].");
            }
        }
    }

    /**
     * Returns the current principal's Claims if authenticated with a valid JWT, or null if anonymous.
     * Write paths cannot be reached by anonymous users due to Spring Security filter chain.
     */
    private ScopeHelper.Claims currentClaimsOrNull() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        return (principal instanceof ScopeHelper.Claims c) ? c : null;
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }
}
