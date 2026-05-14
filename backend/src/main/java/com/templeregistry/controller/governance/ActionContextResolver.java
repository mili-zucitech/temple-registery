package com.templeregistry.controller.governance;

import com.templeregistry.service.workflow.ActionContext;
import org.springframework.stereotype.Component;
import org.springframework.security.core.Authentication;

import java.util.Set;

/**
 * Resolves ActionContext from the authenticated JWT principal.
 * Extracts userId, role, districtId, and ownedTempleIds from the security context.
 *
 * Implement by reading claims from the JWT or from the ScopeHelper as is done in other controllers.
 */
@Component("controllerActionContextResolver")
public class ActionContextResolver {

    public ActionContext resolve(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new org.springframework.security.access.AccessDeniedException("Not authenticated");
        }

        // Pull claims from existing ScopeHelper pattern
        // In your existing code, claims come from JwtAuthFilter → SecurityContext
        var principal = auth.getPrincipal();

        // Default fallback — wire to your actual JWT claims extraction
        // (The existing ScopeHelper.Claims.from(auth) pattern should be used here)
        if (principal instanceof com.templeregistry.security.ScopeHelper.Claims claims) {
            return ActionContext.builder()
                .actorId(claims.userId())
                .actorRole(resolveRole(auth))
                .actorDistrictId(claims.districtId())
                .ownedTempleIds(claims.templeIds() != null ? claims.templeIds() : Set.of())
                .build();
        }

        // Fallback for tests/service accounts
        return ActionContext.builder()
            .actorId(0L)
            .actorRole("SYSTEM")
            .build();
    }

    private String resolveRole(Authentication auth) {
        return auth.getAuthorities().stream()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .map(r -> switch (r) {
                case "DISTRICT_COLLECTOR" -> "DC";
                case "TEMPLE_AUTHORITY"   -> "TA";
                default -> r;
            })
            .filter(r -> r.equals("TA") || r.equals("DC") || r.equals("DC_STAFF")
                      || r.equals("SUPER_ADMIN") || r.equals("SYSTEM"))
            .findFirst()
            .orElse("UNKNOWN");
    }
}
