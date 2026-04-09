package com.templeregistry.service.document;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.document.DocumentUrlResponse;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {

    /**
     * Validate, upload to S3, and persist document metadata.
     * @param ownerType  "TEMPLE", "TRUST", "EMPLOYEE", "CONTRACTOR", "DECLARATION"
     * @param ownerId    ID of the owning entity
     * @param referenceId optional secondary reference (e.g. declarationId)
     * @param label      human-readable label
     * @param file       multipart file (validated: PDF/JPG/PNG, max 5 MB)
     */
    DocumentResponse upload(String ownerType, Long ownerId, Long referenceId, String label, MultipartFile file);

    DocumentResponse getById(Long id);

    /**
     * Generate a pre-signed URL. Records access in {@code document_access_logs}.
     */
    DocumentUrlResponse getPresignedUrl(Long id);

    PaginatedResponse<DocumentResponse> listByOwner(String ownerType, Long ownerId, int page, int size);

    /** Soft-deletes the DB record; does NOT delete the S3 object (retain for audit). */
    void softDelete(Long id);
}
