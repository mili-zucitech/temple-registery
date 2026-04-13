package com.templeregistry.dto.request.temple;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for creating or updating a temple profile staging draft.
 * All fields are optional — only non-null fields are applied (patch semantics).
 * Maps to the supplementary profile fields that require DC review before publication.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTempleProfileStagingRequest {

    /** VAL-016: exactly 10 numeric digits. */
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be exactly 10 digits with no country code prefix")
    private String phone;

    /** VAL-017: RFC 5322-compliant email. */
    @Email(message = "Must be a valid email address")
    @Size(max = 255)
    private String email;

    @Size(max = 500)
    private String website;

    @Size(max = 255)
    private String contactPersonName;

    @Size(max = 100)
    private String contactPersonDesignation;

    /** Relative file path of an already-uploaded photograph (from document upload). */
    @Size(max = 1000)
    private String photoFilePath;

    /** Plain text bank account number; JPA AttributeConverter encrypts (AES-256-GCM) before persist. */
    private String bankAccountNumber;

    @Size(max = 100)
    private String bankName;

    /** VAL-021: /^[A-Z]{4}0[A-Z0-9]{6}$/ (11 chars). */
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Bank IFSC must match pattern: 4 alpha + 0 + 6 alphanumeric")
    private String bankIfsc;

    @Size(max = 500)
    private String languagesOfWorship;

    /** JSON string representing an array of linked mutt/sub-temple names. */
    private String linkedInstitutions;

    private String description;

    private String annualFestivals;

    @Size(max = 500)
    private String landmark;

    private String historicalSignificance;
}
