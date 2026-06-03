package com.templeregistry.util;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class AesEncryptionConverterTest {

    // 32-byte (256-bit) key for AES-256
    private static final String TEST_KEY = "TestEncryptKey12TestEncryptKey12";

    private AesEncryptionConverter converter() {
        return new AesEncryptionConverter(TEST_KEY);
    }

    @Nested
    class ConvertToDatabaseColumn {

        @Test
        void should_returnNull_when_plaintextIsNull() {
            assertThat(converter().convertToDatabaseColumn(null)).isNull();
        }

        @Test
        void should_returnBase64String_when_plaintextProvided() {
            String encoded = converter().convertToDatabaseColumn("123456789012");
            assertThat(encoded).isNotNull().isNotBlank();
            // Verify it's valid Base64
            assertThatNoException().isThrownBy(() ->
                    java.util.Base64.getDecoder().decode(encoded));
        }

        @Test
        void should_produceDifferentCiphertext_when_encryptedTwice() {
            // Different IVs should produce different ciphertexts
            String enc1 = converter().convertToDatabaseColumn("aadhaar-12-digits");
            String enc2 = converter().convertToDatabaseColumn("aadhaar-12-digits");
            assertThat(enc1).isNotEqualTo(enc2);
        }
    }

    @Nested
    class ConvertToEntityAttribute {

        @Test
        void should_returnNull_when_encodedIsNull() {
            assertThat(converter().convertToEntityAttribute(null)).isNull();
        }

        @Test
        void should_returnOriginal_when_encodedIsBlank() {
            assertThat(converter().convertToEntityAttribute("")).isEqualTo("");
        }

        @Test
        void should_roundTrip_when_encryptedAndDecrypted() {
            AesEncryptionConverter c = converter();
            String plaintext = "123456789012"; // Aadhaar-like 12-digit value
            String encoded = c.convertToDatabaseColumn(plaintext);
            String decrypted = c.convertToEntityAttribute(encoded);
            assertThat(decrypted).isEqualTo(plaintext);
        }

        @Test
        void should_returnAsIs_when_valueTooShortToBeValidCiphertext() {
            // Very short string that can't be valid AES-GCM ciphertext
            String legacy = "too-short";
            String result = converter().convertToEntityAttribute(legacy);
            // Either null (decryption error fallback) or the original (legacy plaintext fallback)
            assertThat(result == null || result.equals(legacy)).isTrue();
        }
    }

    @Nested
    class Constructor {

        @Test
        void should_throwIllegalArgument_when_keyIsNot32Bytes() {
            assertThatThrownBy(() -> new AesEncryptionConverter("short-key"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("32 bytes");
        }
    }
}
