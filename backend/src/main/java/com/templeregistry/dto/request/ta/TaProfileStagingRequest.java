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

    @Size(max = 255)
    private String contactPersonDesignation;

    private String photoFilePath;
    private String bankAccountNumber;
    private String bankName;
    private String bankIfsc;
    private java.util.List<String> languagesOfWorship;
    private java.util.List<String> linkedInstitutions;
    private String description;
    private String annualFestivals;
    private String landmark;
    private String historicalSignificance;
}
