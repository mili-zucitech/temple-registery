package com.templeregistry.validation;

import com.templeregistry.service.validation.FinancialYearValidationService;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValidFinancialYearValidatorTest {

    @Mock FinancialYearValidationService validationService;
    @Mock ConstraintValidatorContext context;
    @Mock ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    private ValidFinancialYearValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ValidFinancialYearValidator(validationService);
    }

    @Nested
    class IsValid {

        @Test
        void should_returnFalse_when_valueIsNull() {
            boolean result = validator.isValid(null, context);
            assertThat(result).isFalse();
            verifyNoInteractions(validationService);
        }

        @Test
        void should_returnFalse_when_valueIsBlank() {
            boolean result = validator.isValid("   ", context);
            assertThat(result).isFalse();
            verifyNoInteractions(validationService);
        }

        @Test
        void should_returnFalse_when_valueIsEmpty() {
            boolean result = validator.isValid("", context);
            assertThat(result).isFalse();
            verifyNoInteractions(validationService);
        }

        @Test
        void should_returnTrue_when_validFinancialYear() {
            when(validationService.normalizeAndValidate("2024-25")).thenReturn("2024-25");

            boolean result = validator.isValid("2024-25", context);
            assertThat(result).isTrue();
        }

        @Test
        void should_returnFalse_when_serviceThrowsIllegalArgument() {
            when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
            doThrow(new IllegalArgumentException("Invalid financial year format"))
                    .when(validationService).normalizeAndValidate("bad-year");

            boolean result = validator.isValid("bad-year", context);

            assertThat(result).isFalse();
            verify(context).disableDefaultConstraintViolation();
            verify(context).buildConstraintViolationWithTemplate("Invalid financial year format");
        }
    }
}
