package com.templeregistry.util;

import com.templeregistry.exception.IllegalStatusTransitionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

class StatusTransitionValidatorTest {

    private final StatusTransitionValidator validator = new StatusTransitionValidator();

    @Test
    void should_allow_DRAFT_to_PENDING_REVIEW() {
        assertThatCode(() -> validator.validateDeclarationTransition("DRAFT", "PENDING_REVIEW"))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @CsvSource({
            "PENDING_REVIEW, APPROVED",
            "PENDING_REVIEW, REJECTED",
            "PENDING_REVIEW, CLARIFICATION_REQUESTED",
            "PENDING_REVIEW, PHYSICAL_VERIFICATION_REQUESTED",
            "PENDING_REVIEW, UNDER_REVIEW",
            "CLARIFICATION_REQUESTED, RESUBMITTED",
            "RESUBMITTED, UNDER_REVIEW",
            "PHYSICAL_VERIFICATION_REQUESTED, APPROVED",
            "PHYSICAL_VERIFICATION_REQUESTED, REJECTED"
    })
    void should_allow_valid_transitions(String from, String to) {
        assertThatCode(() -> validator.validateDeclarationTransition(from, to))
                .doesNotThrowAnyException();
    }

    @Test
    void should_throw_when_REJECTED_state_is_mutated() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("REJECTED", "PENDING_REVIEW"))
                .isInstanceOf(IllegalStatusTransitionException.class);
    }

    @Test
    void should_throw_when_APPROVED_state_transitions_further() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("APPROVED", "REJECTED"))
                .isInstanceOf(IllegalStatusTransitionException.class);
    }

    @Test
    void should_throw_when_DRAFT_jumps_directly_to_APPROVED() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("DRAFT", "APPROVED"))
                .isInstanceOf(IllegalStatusTransitionException.class);
    }
}
