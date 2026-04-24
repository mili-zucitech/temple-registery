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
            "DRAFT",                      Set.of("SUBMITTED"),
            "SUBMITTED",                  Set.of("UNDER_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUIRED", "SITE_VISIT_SCHEDULED"),
            "UNDER_REVIEW",               Set.of("APPROVED", "REJECTED", "CLARIFICATION_REQUIRED", "SITE_VISIT_SCHEDULED"),
            "CLARIFICATION_REQUIRED",     Set.of("CLARIFICATION_RESPONDED", "OVERDUE"),
            "CLARIFICATION_RESPONDED",    Set.of("UNDER_REVIEW", "APPROVED", "REJECTED"),
            "SITE_VISIT_SCHEDULED",       Set.of("SITE_VISIT_COMPLETED"),
            "SITE_VISIT_COMPLETED",       Set.of("VERIFIED"),
            "VERIFIED",                   Set.of("APPROVED", "REJECTED"),
            "OVERDUE",                    Set.of("SUBMITTED")
    );

    // Temple Profile Staging state machine
    private static final Map<String, Set<String>> PROFILE_STAGING_TRANSITIONS = Map.of(
            "DRAFT",          Set.of("PENDING_REVIEW"),
            "PENDING_REVIEW", Set.of("APPROVED", "REJECTED", "SUPERSEDED"),
            "APPROVED",       Set.of("SUPERSEDED")
    );

    public void validateDeclarationTransition(String from, String to) {
        validate("Declaration", DECLARATION_TRANSITIONS, from, to);
    }

    public void validateProfileStagingTransition(String from, String to) {
        validate("ProfileStaging", PROFILE_STAGING_TRANSITIONS, from, to);
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
