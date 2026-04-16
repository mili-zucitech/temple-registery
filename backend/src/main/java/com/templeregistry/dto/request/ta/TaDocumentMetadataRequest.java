package com.templeregistry.dto.request.ta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Metadata for a file that the Temple Authority has already uploaded directly to S3.
 * The backend registers the document reference (s3Key) without receiving the file binary.
 * MIME and size are supplied by the client and re-validated server-side (VAL-004, VAL-005).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaDocumentMetadataRequest {

    /** S3 object key of the already-uploaded file. Must be in the temple's own prefix. */
    @NotBlank(message = "s3Key must not be blank")
    @Size(max = 1000)
    private String s3Key;

    /**
     * MIME type of the uploaded file.
     * Server enforces: application/pdf, image/jpeg, image/png (VAL-004, VAL-006).
     */
    @NotBlank(message = "mimeType must not be blank")
    @Pattern(
        regexp = "application/pdf|image/jpeg|image/png",
        message = "Allowed MIME types: application/pdf, image/jpeg, image/png"
    )
    private String mimeType;

    /** File size in bytes. Server validates max 10 MB (VAL-005). */
    @Positive(message = "fileSizeBytes must be positive")
    private long fileSizeBytes;

    @NotBlank(message = "originalFilename must not be blank")
    @Size(max = 500)
    private String originalFilename;

    @NotBlank(message = "documentLabel must not be blank")
    @Size(max = 255)
    private String documentLabel;
}
