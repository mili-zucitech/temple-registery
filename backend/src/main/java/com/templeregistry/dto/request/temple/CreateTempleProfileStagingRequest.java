package com.templeregistry.dto.request.temple;

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

    @Size(max = 255)
    private String contactPersonName;

    @Size(max = 100)
    private String contactPersonDesignation;

    /** Relative file path of an already-uploaded photograph (from document upload). */
    @Size(max = 1000)
    private String photoFilePath;

    /** Plain text bank account number; service will encrypt before persisting. */
    private String bankAccountNumber;

    private String languagesOfWorship;

    /** JSON string representing an array of linked mutt/sub-temple names. */
    private String linkedInstitutions;

    private String annualFestivals;

    @Size(max = 500)
    private String landmark;

    private String historicalSignificance;
}
