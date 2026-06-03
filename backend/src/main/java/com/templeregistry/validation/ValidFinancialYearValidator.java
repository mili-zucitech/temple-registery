package com.templeregistry.validation;

import com.templeregistry.service.validation.FinancialYearValidationService;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ValidFinancialYearValidator implements ConstraintValidator<ValidFinancialYear, String> {

    private final FinancialYearValidationService financialYearValidationService;

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isBlank()) {
            return false;
        }
        try {
            financialYearValidationService.normalizeAndValidate(value);
            return true;
        } catch (IllegalArgumentException ex) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(ex.getMessage()).addConstraintViolation();
            return false;
        }
    }
}
