package com.templeregistry.service.validation;

import java.util.List;

public interface FinancialYearValidationService {

    /**
     * Validates and normalizes a financial year string.
     * Expected format is YYYY-YY, where YY == (YYYY + 1) % 100.
     *
     * @param financialYear raw input value
     * @return normalized value (trimmed)
     */
    String normalizeAndValidate(String financialYear);

    /**
     * Generates a descending list of valid FY values up to the current FY.
     */
    List<String> recentFinancialYears(int count);
}
