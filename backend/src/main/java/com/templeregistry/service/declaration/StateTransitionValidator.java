package com.templeregistry.service.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.exception.InvalidStateTransitionException;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Single source of truth for all permitted declaration status transitions.
 * Injected into both DeclarationServiceImpl and GovernanceWorkflowServiceImpl.
 * Every workflow method must call validate() before changing status.
 */
@Component
public class StateTransitionValidator {

    private static final Set<String> PERMITTED = Set.of(
        "DRAFT->SUBMITTED",
        "SUBMITTED->UNDER_REVIEW",
        "SUBMITTED->APPROVED",
        "SUBMITTED->REJECTED",
        "SUBMITTED->CLARIFICATION_REQUIRED",
        "SUBMITTED->SITE_VISIT_SCHEDULED",
        "UNDER_REVIEW->APPROVED",
        "UNDER_REVIEW->REJECTED",
        "UNDER_REVIEW->CLARIFICATION_REQUIRED",
        "UNDER_REVIEW->SITE_VISIT_SCHEDULED",
        "CLARIFICATION_REQUIRED->CLARIFICATION_RESPONDED",
        "CLARIFICATION_RESPONDED->UNDER_REVIEW",
        "CLARIFICATION_RESPONDED->APPROVED",
        "CLARIFICATION_RESPONDED->REJECTED",
        "SITE_VISIT_SCHEDULED->SITE_VISIT_COMPLETED",
        "SITE_VISIT_COMPLETED->VERIFIED",
        "VERIFIED->APPROVED",
        "VERIFIED->REJECTED"
    );

    /**
     * Validates that the transition from {@code from} to {@code to} is permitted.
     *
     * @throws InvalidStateTransitionException if the transition is not in the permitted set.
     */
    public void validate(DeclarationStatus from, DeclarationStatus to) {
        String key = from.name() + "->" + to.name();
        if (!PERMITTED.contains(key)) {
            throw new InvalidStateTransitionException(from, to);
        }
    }
}
