package com.templeregistry.util;

import com.templeregistry.service.workflow.TransitionRuleRegistry;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

class StatusTransitionValidatorTest {

    private final TransitionRuleRegistry registry = new TransitionRuleRegistry();
    private final StatusTransitionValidator validator = new StatusTransitionValidator(registry);

    @Test
    void should_allow_DRAFT_to_SUBMITTED() {
        assertThatCode(() -> validator.validateDeclarationTransition("DRAFT", "SUBMITTED"))
                .doesNotThrowAnyException();
    }

        @ParameterizedTest
        @CsvSource({
            "SUBMITTED, APPROVED",
            "SUBMITTED, REJECTED",
            "SUBMITTED, CLARIFICATION_REQUESTED",
            "SUBMITTED, UNDER_REVIEW",
            "CLARIFICATION_REQUESTED, CLARIFICATION_RESPONDED",
            "CLARIFICATION_RESPONDED, UNDER_REVIEW",
            "CLARIFICATION_RESPONDED, APPROVED",
            "CLARIFICATION_RESPONDED, REJECTED",
            "UNDER_REVIEW, APPROVED",
            "UNDER_REVIEW, REJECTED",
            "UNDER_REVIEW, CLARIFICATION_REQUESTED"
    })
    void should_allow_valid_transitions(String from, String to) {
        assertThatCode(() -> validator.validateDeclarationTransition(from, to))
            .doesNotThrowAnyException();
        }

        // Site visit transitions are now handled as sub-statuses within UNDER_REVIEW, not as top-level statuses.
        // Add a separate test for sub-status logic if needed.

    @Test
    void should_throw_when_REJECTED_state_is_mutated() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("REJECTED", "SUBMITTED"))
                .isInstanceOf(com.templeregistry.exception.WorkflowException.class);
    }

    @Test
    void should_throw_when_APPROVED_state_transitions_further() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("APPROVED", "REJECTED"))
                .isInstanceOf(com.templeregistry.exception.WorkflowException.class);
    }

    @Test
    void should_throw_when_DRAFT_jumps_directly_to_APPROVED() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("DRAFT", "APPROVED"))
                .isInstanceOf(com.templeregistry.exception.WorkflowException.class);
    }
}
