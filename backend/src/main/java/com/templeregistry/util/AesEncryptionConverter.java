package com.templeregistry.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Transparent AES-256-GCM encryption/decryption for PII fields (Aadhaar, PAN, bank account).
 * Ciphertext is stored as Base64-encoded string in a TEXT column.
 * IV is prepended to the ciphertext (12 bytes).
 */
@Converter
@Component
@Slf4j
public class AesEncryptionConverter implements AttributeConverter<String, String> {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final byte[] keyBytes;

    public AesEncryptionConverter(@Value("${app.encryption.key:CHANGE_THIS_KEY_IN_PROD_32BYTES!!}") String encryptionKey) {
        this.keyBytes = encryptionKey.getBytes();
        if (this.keyBytes.length != 32) {
            throw new IllegalArgumentException("AES encryption key must be exactly 32 bytes (256 bits).");
        }
    }

    @Override
    public String convertToDatabaseColumn(String plaintext) {
        if (plaintext == null) return null;
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE,
                    new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes());

            ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            byteBuffer.put(iv);
            byteBuffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(byteBuffer.array());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt field.", e);
        }
    }

    @Override
    public String convertToEntityAttribute(String encoded) {
        if (encoded == null || encoded.isBlank()) return encoded;
        try {
            byte[] decoded = Base64.getDecoder().decode(encoded);
            if (decoded.length < GCM_IV_LENGTH + 16) {
                // Too short to be a valid AES-GCM ciphertext (IV + min tag).
                // Treat as legacy plaintext — log a warning so ops can identify and re-encrypt.
                log.warn("AES-GCM: value is too short to be ciphertext ({}B) — treating as legacy plaintext. Re-encrypt this record.", decoded.length);
                return encoded;
            }
            ByteBuffer byteBuffer = ByteBuffer.wrap(decoded);

            byte[] iv = new byte[GCM_IV_LENGTH];
            byteBuffer.get(iv);
            byte[] ciphertext = new byte[byteBuffer.remaining()];
            byteBuffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE,
                    new SecretKeySpec(keyBytes, "AES"),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (IllegalArgumentException e) {
            // Base64 decode failed — value is plaintext, not ciphertext.
            log.warn("AES-GCM: Base64 decode failed — treating as legacy plaintext. Re-encrypt this record.");
            return encoded;
        } catch (Exception e) {
            // Decryption failed with a valid ciphertext structure — key mismatch or corruption.
            // Log at ERROR and return null rather than crashing the application.
            log.error("AES-GCM decryption failed — possible key mismatch or data corruption. Returning null to prevent crash.", e);
            return null;
        }
    }
}
