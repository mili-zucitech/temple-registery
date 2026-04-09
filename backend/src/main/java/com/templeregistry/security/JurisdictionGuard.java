package com.templeregistry.security;

import com.templeregistry.exception.JurisdictionAccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Enforces district-level jurisdiction scoping for DC and DC_STAFF roles.
 * Call assertSameDistrict() before returning any resource.
 */
@Component
public class JurisdictionGuard {

    public void assertSameDistrict(Long resourceDistrictId) {
        ScopeHelper.Claims claims = currentClaims();
        String role = claims.role();
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
            if (!resourceDistrictId.equals(claims.districtId())) {
                throw new JurisdictionAccessDeniedException(
                        "Resource district [" + resourceDistrictId + "] does not match your assigned district ["
                                + claims.districtId() + "].");
            }
        }
        // SUPER_ADMIN and AUDITOR are not jurisdiction-scoped
    }

    public Long enforceDistrictId(Long requestedDistrictId) {
        ScopeHelper.Claims claims = currentClaims();
        String role = claims.role();
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
            return claims.districtId(); // JWT claim always wins for DC roles
        }
        return requestedDistrictId; // SUPER_ADMIN may provide or omit
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }
}
