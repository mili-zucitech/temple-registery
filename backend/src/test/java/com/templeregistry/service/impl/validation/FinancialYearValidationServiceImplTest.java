package com.templeregistry.service.impl.validation;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FinancialYearValidationServiceImplTest {

    private final FinancialYearValidationServiceImpl service = new FinancialYearValidationServiceImpl();

    // ─── normalizeAndValidate ────────────────────────────────────────────────

    @Nested
    class NormalizeAndValidate {

        @Test
        void should_returnNormalized_when_validCurrentYearProvided() {
            // Use actual current FY to avoid flaky test
            LocalDate today = LocalDate.now();
            int fyStart = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
            int fyEndShort = (fyStart + 1) % 100;
            String fy = String.format("%d-%02d", fyStart, fyEndShort);

            String result = service.normalizeAndValidate(fy);

            assertThat(result).isEqualTo(fy);
        }

        @Test
        void should_throwIllegalArgument_when_nullProvided() {
            assertThatThrownBy(() -> service.normalizeAndValidate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("required");
        }

        @Test
        void should_throwIllegalArgument_when_blankProvided() {
            assertThatThrownBy(() -> service.normalizeAndValidate("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("required");
        }

        @Test
        void should_throwIllegalArgument_when_formatWrong() {
            assertThatThrownBy(() -> service.normalizeAndValidate("2024/25"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("YYYY-YY");
        }

        @Test
        void should_throwIllegalArgument_when_endYearMismatch() {
            assertThatThrownBy(() -> service.normalizeAndValidate("2024-26"))  // should be 25
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("start year + 1");
        }

        @Test
        void should_throwIllegalArgument_when_futureYearProvided() {
            LocalDate today = LocalDate.now();
            int futureFyStart = today.getMonthValue() >= 4 ? today.getYear() + 1 : today.getYear();
            int futureEndShort = (futureFyStart + 1) % 100;
            String futureFy = String.format("%d-%02d", futureFyStart, futureEndShort);

            assertThatThrownBy(() -> service.normalizeAndValidate(futureFy))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Future");
        }

        @ParameterizedTest
        @ValueSource(strings = {"2020-21", "2019-20", "2018-19", "2010-11"})
        void should_acceptPastYears_when_validFormatAndSequence(String fy) {
            String result = service.normalizeAndValidate(fy);
            assertThat(result).isEqualTo(fy);
        }

        @Test
        void should_normalizeWhitespace_when_leadingTrailingSpacesPresent() {
            String result = service.normalizeAndValidate("  2024-25  ");
            assertThat(result).isEqualTo("2024-25");
        }

        @Test
        void should_throwIllegalArgument_when_formatIsTooShort() {
            assertThatThrownBy(() -> service.normalizeAndValidate("24-25"))
                .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void should_throwIllegalArgument_when_endYearHasWrongDigits() {
            assertThatThrownBy(() -> service.normalizeAndValidate("2024-2025"))
                .isInstanceOf(IllegalArgumentException.class);
        }
    }

    // ─── recentFinancialYears ─────────────────────────────────────────────────

    @Nested
    class RecentFinancialYears {

        @Test
        void should_returnCorrectCount_when_countIsPositive() {
            List<String> result = service.recentFinancialYears(3);
            assertThat(result).hasSize(3);
        }

        @Test
        void should_returnEmptyList_when_countIsZero() {
            List<String> result = service.recentFinancialYears(0);
            assertThat(result).isEmpty();
        }

        @Test
        void should_returnEmptyList_when_countIsNegative() {
            List<String> result = service.recentFinancialYears(-1);
            assertThat(result).isEmpty();
        }

        @Test
        void should_returnCurrentFyFirst_when_called() {
            LocalDate today = LocalDate.now();
            int fyStart = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
            int fyEndShort = (fyStart + 1) % 100;
            String expectedCurrentFy = String.format("%d-%02d", fyStart, fyEndShort);

            List<String> result = service.recentFinancialYears(3);

            assertThat(result.get(0)).isEqualTo(expectedCurrentFy);
        }

        @Test
        void should_returnDescendingOrder_when_multipleYearsRequested() {
            List<String> result = service.recentFinancialYears(5);

            // Each subsequent year should be 1 year earlier
            for (int i = 0; i < result.size() - 1; i++) {
                int year1 = Integer.parseInt(result.get(i).substring(0, 4));
                int year2 = Integer.parseInt(result.get(i + 1).substring(0, 4));
                assertThat(year1).isEqualTo(year2 + 1);
            }
        }

        @Test
        void should_returnValidFyFormat_when_called() {
            List<String> result = service.recentFinancialYears(10);

            result.forEach(fy -> {
                assertThat(fy).matches("\\d{4}-\\d{2}");
                // Each fy must pass validation
                String validated = service.normalizeAndValidate(fy);
                assertThat(validated).isEqualTo(fy);
            });
        }
    }
}
