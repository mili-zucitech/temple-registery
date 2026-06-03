package com.templeregistry.service.impl.validation;

import com.templeregistry.service.validation.FinancialYearValidationService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class FinancialYearValidationServiceImpl implements FinancialYearValidationService {

    private static final Pattern FY_PATTERN = Pattern.compile("^\\d{4}-\\d{2}$");

    @Override
    public String normalizeAndValidate(String financialYear) {
        if (financialYear == null || financialYear.trim().isBlank()) {
            throw new IllegalArgumentException("Financial year is required.");
        }

        String normalized = financialYear.trim();
        if (!FY_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("Financial year must be in YYYY-YY format.");
        }

        int startYear = Integer.parseInt(normalized.substring(0, 4));
        int endYearShort = Integer.parseInt(normalized.substring(5, 7));
        int expectedEndYearShort = (startYear + 1) % 100;
        if (endYearShort != expectedEndYearShort) {
            throw new IllegalArgumentException("Financial year end must be start year + 1.");
        }

        int currentFyStart = currentFinancialYearStart();
        if (startYear > currentFyStart) {
            throw new IllegalArgumentException("Future financial year is not allowed.");
        }

        return normalized;
    }

    @Override
    public List<String> recentFinancialYears(int count) {
        int safeCount = Math.max(0, count);
        int start = currentFinancialYearStart();
        List<String> values = new ArrayList<>(safeCount);
        for (int i = 0; i < safeCount; i++) {
            int fyStart = start - i;
            int fyEndShort = (fyStart + 1) % 100;
            values.add(String.format("%d-%02d", fyStart, fyEndShort));
        }
        return values;
    }

    private int currentFinancialYearStart() {
        LocalDate today = LocalDate.now();
        return today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
    }
}
