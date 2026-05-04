package com.templeregistry.service.workflow;

import lombok.Builder;
import lombok.Getter;

/**
 * Execution context carrying actor information for workflow validation.
 * Resolved from the JWT SecurityContext by the controller layer.
 */
@Getter
@Builder
public class ActionContext {

    /** Authenticated user ID. */
    private final Long actorId;

    /**
     * Role of the actor: TA, DC, SUPER_ADMIN, SYSTEM.
     * Validated against transition rule's requiredRole.
     */
    private final String actorRole;

    /**
     * District the DC is assigned to.
     * Used for jurisdiction check: actor.districtId must match workflow_instance.district_id.
     * Null for TA actors (no jurisdiction constraint — ownership check applies instead).
     */
    private final Long actorDistrictId;

    /**
     * Temple IDs owned by this TA actor.
     * Used for ownership check: workflow_instance.temple_id must be in this set.
     * Null for DC actors (no ownership constraint — jurisdiction check applies instead).
     */
    private final java.util.Set<Long> ownedTempleIds;

    /** Convenience: returns true if this is a DC role. */
    public boolean isDc() {
        return "DC".equals(actorRole) || "DC_STAFF".equals(actorRole);
    }

    /** Convenience: returns true if this is a TA role. */
    public boolean isTa() {
        return "TA".equals(actorRole);
    }

    /** Convenience: returns true if SUPER_ADMIN. */
    public boolean isSuperAdmin() {
        return "SUPER_ADMIN".equals(actorRole);
    }

    /** Convenience: returns true if SYSTEM (scheduled jobs, auto-transitions). */
    public boolean isSystem() {
        return "SYSTEM".equals(actorRole);
    }

    public static ActionContext system() {
        return ActionContext.builder()
            .actorId(0L)
            .actorRole("SYSTEM")
            .build();
    }
}
