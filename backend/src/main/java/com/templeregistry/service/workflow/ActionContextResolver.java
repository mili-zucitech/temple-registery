package com.templeregistry.service.workflow;

import com.templeregistry.security.ScopeHelper;
import org.springframework.stereotype.Component;

import java.util.Set;

/** Resolves ActionContext from ScopeHelper claims for workflow services/controllers. */
@Component
public class ActionContextResolver {

    public ActionContext resolve(ScopeHelper.Claims claims) {
        String role = claims.districtId() != null ? "DC" : "TA";
        
        return ActionContext.builder()
            .actorId(claims.userId())
            .actorRole(role)
            .actorDistrictId(claims.districtId())
            .ownedTempleIds(claims.templeIds() != null ? claims.templeIds() : Set.of())
            .build();
    }
}
