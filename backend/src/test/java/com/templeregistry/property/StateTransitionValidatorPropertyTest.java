package com.templeregistry.property;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.exception.InvalidStateTransitionException;
import com.templeregistry.service.declaration.StateTransitionValidator;
import net.jqwik.api.*;

import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 1: StateTransitionValidator Completeness
 *
 * For any (fromStatus, toStatus) pair drawn from the 12-value DeclarationStatus enum,
 * StateTransitionValidator.validate(from, to) must succeed if and only if the pair is
 * in the permitted transition set; for every pair not in the permitted set, it must
 * throw InvalidStateTransitionException.
 *
 * Validates: Requirements 2.2, 2.3, 2.5
 */
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

        String key = from.name() + "->" + to.name();

        if (PERMITTED.contains(key)) {
            // Permitted transitions must succeed without exception
            assertThatCode(() -> validator.validate(from, to))
                    .as("Permitted transition %s should not throw", key)
                    .doesNotThrowAnyException();
        } else {
            // Non-permitted transitions must throw InvalidStateTransitionException
            assertThatThrownBy(() -> validator.validate(from, to))
                    .as("Non-permitted transition %s should throw InvalidStateTransitionException", key)
                    .isInstanceOf(InvalidStateTransitionException.class)
                    .hasMessageContaining(from.name())
                    .hasMessageContaining(to.name());
        }
    }

    /**
     * Property 1b: Exhaustive check — all 144 (12x12) pairs are explicitly verified.
     * This ensures no pair is missed by the random sampling above.
     */
    @Example
    void allPairsExhaustiveCheck() {
        DeclarationStatus[] statuses = DeclarationStatus.values();
        // 12 statuses × 12 statuses = 144 pairs
        assertThat(statuses).hasSize(12);

        int permittedCount = 0;
        int rejectedCount = 0;

        for (DeclarationStatus from : statuses) {
            for (DeclarationStatus to : statuses) {
                String key = from.name() + "->" + to.name();
                if (PERMITTED.contains(key)) {
                    assertThatCode(() -> validator.validate(from, to))
                            .as("Permitted transition %s should not throw", key)
                            .doesNotThrowAnyException();
                    permittedCount++;
                } else {
                    assertThatThrownBy(() -> validator.validate(from, to))
                            .as("Non-permitted transition %s should throw", key)
                            .isInstanceOf(InvalidStateTransitionException.class);
                    rejectedCount++;
                }
            }
        }

        assertThat(permittedCount).as("Should have exactly 18 permitted transitions").isEqualTo(18);
        assertThat(rejectedCount).as("Should have exactly 126 rejected transitions (144 - 18)").isEqualTo(126);
    }

    /**
     * Property 1c: Exception message must always contain both from and to status names.
     */
    @Property(tries = 200)
    void invalidTransitionExceptionContainsBothStatuses(
            @ForAll DeclarationStatus from,
            @ForAll DeclarationStatus to) {

        String key = from.name() + "->" + to.name();
        if (!PERMITTED.contains(key)) {
            assertThatThrownBy(() -> validator.validate(from, to))
                    .isInstanceOf(InvalidStateTransitionException.class)
                    .hasMessageContaining(from.name())
                    .hasMessageContaining(to.name());
        }
    }
}
