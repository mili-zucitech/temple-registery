package com.templeregistry.dto.response.ta;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Document metadata response returned to the Temple Authority.
 * The s3Key is intentionally excluded to prevent direct S3 access.
 * Use the presigned URL endpoint (document service) for download.
 */
@Getter
@Builder
public class TaDocumentResponse {

    private Long id;
    private String documentLabel;
    private String originalFilename;
    private String mimeType;
    private long fileSizeBytes;
    private LocalDateTime createdAt;
}
