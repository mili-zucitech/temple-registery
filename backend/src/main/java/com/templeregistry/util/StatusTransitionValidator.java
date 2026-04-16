package com.templeregistry.util;

import com.templeregistry.exception.IllegalStatusTransitionException;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * Centralized status-transition validator for all state machines in the system.
 * Each state machine is registered by name. The validator throws
 * IllegalStatusTransitionException if the requested transition is not permitted.
 * REJECTED is always immutable — no transition away from it is ever allowed.
 */
@Component
public class StatusTransitionValidator {

    private static final String REJECTED = "REJECTED";

    // Declaration state machine
    private static final Map<String, Set<String>> DECLARATION_TRANSITIONS = Map.of(
            "DRAFT",                           Set.of("PENDING_REVIEW"),
            "PENDING_REVIEW",                  Set.of("UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUESTED", "PHYSICAL_VERIFICATION_REQUESTED", "OVERDUE", "DRAFT"),
            "UNDER_REVIEW",                    Set.of("APPROVED", "REJECTED", "CLARIFICATION_REQUESTED", "PHYSICAL_VERIFICATION_REQUESTED"),
            "RESUBMITTED",                     Set.of("UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUESTED", "PHYSICAL_VERIFICATION_REQUESTED"),
            "CLARIFICATION_REQUESTED",         Set.of("RESUBMITTED", "OVERDUE"),
            "PHYSICAL_VERIFICATION_REQUESTED", Set.of("APPROVED", "REJECTED", "CLARIFICATION_REQUESTED", "RESUBMITTED"),
            "OVERDUE",                         Set.of("RESUBMITTED", "PENDING_REVIEW")
    );

    public void validateDeclarationTransition(String from, String to) {
        validate("Declaration", DECLARATION_TRANSITIONS, from, to);
    }

    private void validate(String context,
                          Map<String, Set<String>> transitions,
                          String from, String to) {
        if (REJECTED.equals(from)) {
            throw new IllegalStatusTransitionException(
                    context + " status REJECTED is immutable and cannot be transitioned.");
        }
        Set<String> allowed = transitions.get(from);
        if (allowed == null || !allowed.contains(to)) {
            throw new IllegalStatusTransitionException(from, to);
        }
    }
}
