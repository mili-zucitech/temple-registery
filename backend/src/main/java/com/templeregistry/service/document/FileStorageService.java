package com.templeregistry.service.document;

import org.springframework.web.multipart.MultipartFile;

/**
 * Low-level file storage abstraction. Backed by {@code S3FileStorageServiceImpl}.
 * Controllers and higher-level services must never call S3 directly.
 */
public interface FileStorageService {

    /**
     * Upload a file and return the S3 object key.
     * @param folder   logical folder prefix (e.g. "temples/42/docs")
     * @param file     the multipart file
     * @return         object key in the configured S3 bucket
     */
    String upload(String folder, MultipartFile file);

    /**
     * Generate a short-lived (15-minute) pre-signed GET URL.
     * @param s3Key  the object key returned by {@link #upload}
     * @return       HTTPS pre-signed URL
     */
    String presignedUrl(String s3Key);

    /**
     * Permanently delete an object from S3.
     * Only called when the {@link com.templeregistry.entity.document.Document} record is hard-deleted.
     */
    void delete(String s3Key);
}
