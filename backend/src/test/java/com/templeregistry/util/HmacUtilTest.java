package com.templeregistry.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Proves HmacUtil produces deterministic, non-null hashes and handles edge cases.
 */
class HmacUtilTest {

    // 32-byte key for testing
    private final HmacUtil hmacUtil = new HmacUtil("TestHmacKey1234567890123456789012");

    @Test
    void same_input_produces_same_hash() {
        String h1 = hmacUtil.hash("123456789012");
        String h2 = hmacUtil.hash("123456789012");
        assertThat(h1).isEqualTo(h2);
    }

    @Test
    void different_inputs_produce_different_hashes() {
        String h1 = hmacUtil.hash("123456789012");
        String h2 = hmacUtil.hash("123456789013");
        assertThat(h1).isNotEqualTo(h2);
    }

    @Test
    void hash_is_64_hex_characters() {
        String hash = hmacUtil.hash("123456789012");
        assertThat(hash).hasSize(64).matches("[0-9a-f]+");
    }

    @Test
    void null_input_returns_null() {
        assertThat(hmacUtil.hash(null)).isNull();
    }

    @Test
    void blank_input_returns_null() {
        assertThat(hmacUtil.hash("   ")).isNull();
    }

    @Test
    void key_too_short_throws_on_construction() {
        assertThatThrownBy(() -> new HmacUtil("short"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("32 bytes");
    }
}
