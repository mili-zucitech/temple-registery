package com.templeregistry.util;

import com.templeregistry.exception.IllegalStatusTransitionException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.*;

class StatusTransitionValidatorTest {

    private final StatusTransitionValidator validator = new StatusTransitionValidator();

    @Test
    void should_allow_DRAFT_to_SUBMITTED() {
        assertThatCode(() -> validator.validateDeclarationTransition("DRAFT", "SUBMITTED"))
                .doesNotThrowAnyException();
    }

    @ParameterizedTest
    @CsvSource({
            "SUBMITTED, APPROVED",
            "SUBMITTED, REJECTED",
            "SUBMITTED, CLARIFICATION_REQUIRED",
            "SUBMITTED, SITE_VISIT_SCHEDULED",
            "SUBMITTED, UNDER_REVIEW",
            "CLARIFICATION_REQUIRED, CLARIFICATION_RESPONDED",
            "CLARIFICATION_RESPONDED, UNDER_REVIEW",
            "SITE_VISIT_SCHEDULED, SITE_VISIT_COMPLETED",
            "SITE_VISIT_COMPLETED, VERIFIED",
            "VERIFIED, APPROVED",
            "VERIFIED, REJECTED"
    })
    void should_allow_valid_transitions(String from, String to) {
        assertThatCode(() -> validator.validateDeclarationTransition(from, to))
                .doesNotThrowAnyException();
    }

    @Test
    void should_throw_when_REJECTED_state_is_mutated() {
        assertThatThrownBy(() -> validator.validateDeclarationTransition("REJECTED", "SUBMITTED"))
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
