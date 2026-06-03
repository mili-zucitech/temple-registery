package com.templeregistry.service.workflow;

import com.templeregistry.security.ScopeHelper;
import org.springframework.stereotype.Component;

import java.util.Set;

/** Resolves ActionContext from ScopeHelper claims for workflow services/controllers. */
@Component
public class ActionContextResolver {

    public ActionContext resolve(ScopeHelper.Claims claims) {
        // Map the JWT role to the canonical workflow actor role.
        // SUPER_ADMIN has no districtId but must resolve to "SUPER_ADMIN", not "TA".
        String role = switch (claims.role() != null ? claims.role() : "") {
            case "DISTRICT_COLLECTOR" -> "DC";
            case "TEMPLE_AUTHORITY"   -> "TA";
            case "DC_STAFF"           -> "DC_STAFF";
            default -> claims.role() != null ? claims.role() : "UNKNOWN"; // SUPER_ADMIN, AUDITOR, VIEWER
        };

        return ActionContext.builder()
            .actorId(claims.userId())
            .actorRole(role)
            .actorDistrictId(claims.districtId())
            .ownedTempleIds(claims.templeIds() != null ? claims.templeIds() : Set.of())
            .build();
    }
}
