package com.templeregistry.dto.request.ta;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Temple Authority request to create or update a profile staging draft.
 * All fields are optional (patch semantics: null = leave unchanged).
 * Validation rules per workflow spec section 5.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaProfileStagingRequest {

    /** VAL-016: exactly 10 numeric digits; no country code prefix. */
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

    /**
     * S3 key of the temple photograph, already uploaded via the document endpoint.
     * Must reference a document with MIME type image/jpeg or image/png (VAL-006).
     */
    @Size(max = 1000)
    private String photoFilePath;

    /**
     * Plain text bank account number. Stored AES-256-GCM encrypted in the DB.
     * Response will mask all but last 4 digits (VAL-008).
     */
    private String bankAccountNumber;

    @Size(max = 100)
    private String bankName;

    /** VAL-021: 11-char IFSC — 4 alpha + '0' + 6 alphanumeric. */
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Bank IFSC must match pattern: 4 alpha + 0 + 6 alphanumeric")
    private String bankIfsc;

    @Size(max = 500)
    private String languagesOfWorship;

    /** JSON array of linked mutt or sub-temple names (v1: text, no FK). */
    private String linkedInstitutions;

    private String description;

    private String annualFestivals;

    @Size(max = 500)
    private String landmark;

    private String historicalSignificance;
}
