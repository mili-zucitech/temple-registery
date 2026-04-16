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
        ScopeHelper.Claims claims = currentClaims();
        if (RoleConstants.TEMPLE_AUTHORITY.equals(claims.role())) {
            if (!resourceTempleId.equals(claims.templeId())) {
                throw new JurisdictionAccessDeniedException(
                        "You are not authorized to access temple [" + resourceTempleId + "].");
            }
        }
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }
}
