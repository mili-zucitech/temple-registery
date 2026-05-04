package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowStatus;
import lombok.Builder;
import lombok.Getter;

/**
 * A single transition rule: given (entityType, fromStatus, action) → toStatus.
 * entityType = "*" means the rule applies to ALL modules.
 */
@Getter
@Builder
public class TransitionRule {

    /** "*" = universal. "TEMPLE_PROFILE" / "DECLARATION" / "TRUST" / "BOARD_MEMBER" = specific. */
    private final String entityType;

    private final WorkflowStatus fromStatus;

    private final WorkflowAction action;

    private final WorkflowStatus toStatus;

    /** Which role may execute this action: TA, DC, SYSTEM, SUPER_ADMIN. */
    private final String requiredRole;

    /**
     * Optional sub-status to SET on the workflow instance after this transition.
     * Null = clear any existing sub-status.
     */
    private final String subStatusEffect;

    /**
     * If true, any existing sub-status is explicitly cleared on this transition.
     * If false, sub-status is inherited from previous state.
     */
    @Builder.Default
    private final boolean clearSubStatus = false;

    /** Matches any entityType if this rule's entityType is "*". */
    public boolean matches(String entityType, WorkflowStatus fromStatus, WorkflowAction action) {
        boolean entityMatch = "*".equals(this.entityType) || this.entityType.equals(entityType);
        return entityMatch && this.fromStatus == fromStatus && this.action == action;
    }
}
