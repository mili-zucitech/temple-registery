package com.templeregistry.util;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

class PaginationUtilTest {

    private final PaginationUtil util = new PaginationUtil();

    // ─── clampSize ────────────────────────────────────────────────────────────

    @Nested
    class ClampSize {

        @Test
        void should_return10_when_requestedSizeIsNull() {
            assertThat(util.clampSize(null)).isEqualTo(10);
        }

        @Test
        void should_return10_when_requestedSizeIsZero() {
            assertThat(util.clampSize(0)).isEqualTo(10);
        }

        @Test
        void should_return10_when_requestedSizeIsNegative() {
            assertThat(util.clampSize(-5)).isEqualTo(10);
        }

        @Test
        void should_returnRequestedSize_when_withinBounds() {
            assertThat(util.clampSize(25)).isEqualTo(25);
        }

        @Test
        void should_return100_when_requestedSizeExceedsMax() {
            assertThat(util.clampSize(500)).isEqualTo(100);
        }

        @Test
        void should_return100_when_requestedSizeExactlyMax() {
            assertThat(util.clampSize(100)).isEqualTo(100);
        }

        @Test
        void should_return1_when_requestedSizeIsOne() {
            assertThat(util.clampSize(1)).isEqualTo(1);
        }

        @ParameterizedTest
        @ValueSource(ints = {10, 20, 50, 75, 99})
        void should_returnExactSize_when_withinValidRange(int size) {
            assertThat(util.clampSize(size)).isEqualTo(size);
        }
    }
}
