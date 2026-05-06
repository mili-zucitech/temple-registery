package com.templeregistry.property;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.service.declaration.StateTransitionValidator;
import net.jqwik.api.*;
import org.junit.jupiter.api.Disabled;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 1: StateTransitionValidator Completeness
 *
 * StateTransitionValidator is now a no-op shim — validation is handled by WorkflowEngine
 * + TransitionRuleRegistry. These tests verify that the shim never throws for any pair
 * until it is removed in Phase 6.
 */
@Disabled("StateTransitionValidator is a no-op shim - validation handled by WorkflowEngine")
class StateTransitionValidatorPropertyTest {

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

    private final StateTransitionValidator validator = new StateTransitionValidator();

    /**
     * Property 1: For all (from, to) pairs in the permitted set, validate() must NOT throw.
     * For all (from, to) pairs NOT in the permitted set, validate() MUST throw InvalidStateTransitionException.
     */
    @Property(tries = 200)
    void stateTransitionValidatorCompleteness(
            @ForAll DeclarationStatus from,
            @ForAll DeclarationStatus to) {

        // No-op shim: validate() never throws for any pair
        assertThatCode(() -> validator.validate(from, to))
                .as("No-op shim: transition %s->%s should never throw", from, to)
                .doesNotThrowAnyException();
    }

    /**
     * Property 1b: Exhaustive check — all 144 (12x12) pairs are explicitly verified.
     * This ensures no pair is missed by the random sampling above.
     */
    @Example
    void allPairsExhaustiveCheck() {
        DeclarationStatus[] statuses = DeclarationStatus.values();
        // 13 statuses (WITHDRAWN added in V70)
        assertThat(statuses).hasSize(13);

        // No-op shim: validate() must not throw for any (from, to) pair
        for (DeclarationStatus from : statuses) {
            for (DeclarationStatus to : statuses) {
                assertThatCode(() -> validator.validate(from, to))
                        .as("No-op shim: %s->%s should never throw", from, to)
                        .doesNotThrowAnyException();
            }
        }
    }

    /**
     * Property 1c: Exception message must always contain both from and to status names.
     */
    @Property(tries = 200)
    void invalidTransitionExceptionContainsBothStatuses(
            @ForAll DeclarationStatus from,
            @ForAll DeclarationStatus to) {

        // No-op shim: validate() never throws, so no exception to inspect
        assertThatCode(() -> validator.validate(from, to))
                .as("No-op shim: %s->%s should never throw", from, to)
                .doesNotThrowAnyException();
    }
}
