package com.templeregistry.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Produces a deterministic HMAC-SHA256 hash of a plaintext value.
 * Used for Aadhaar duplicate detection: AES-GCM with a random IV cannot be used
 * for equality lookups because the same plaintext produces a different ciphertext each time.
 *
 * The HMAC key is separate from the AES encryption key so that a compromise of one
 * does not compromise the other.
 */
@Component
public class HmacUtil {

    private static final String ALGORITHM = "HmacSHA256";

    private final byte[] keyBytes;

    public HmacUtil(@Value("${app.hmac.key}") String hmacKey) {
        this.keyBytes = hmacKey.getBytes(StandardCharsets.UTF_8);
        if (this.keyBytes.length < 32) {
            throw new IllegalArgumentException("HMAC key must be at least 32 bytes.");
        }
    }

    /**
     * Returns a lowercase hex HMAC-SHA256 of the given plaintext.
     * Returns null if plaintext is null or blank.
     */
    public String hash(String plaintext) {
        if (plaintext == null || plaintext.isBlank()) return null;
        try {
            Mac mac = Mac.getInstance(ALGORITHM);
            mac.init(new SecretKeySpec(keyBytes, ALGORITHM));
            byte[] digest = mac.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("HMAC computation failed.", e);
        }
    }
}
