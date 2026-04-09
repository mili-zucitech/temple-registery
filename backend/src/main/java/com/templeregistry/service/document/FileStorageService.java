package com.templeregistry.service.document;

import org.springframework.web.multipart.MultipartFile;

/**
 * Low-level file storage abstraction. Backed by {@code LocalFileStorageServiceImpl}.
 * Controllers and higher-level services must never access the filesystem directly.
 */
public interface FileStorageService {

    /**
     * Upload a file and return the relative file path.
     * @param folder   logical folder prefix (e.g. "temples/42/docs")
     * @param file     the multipart file
     * @return         relative file path within the configured base directory
     */
    String upload(String folder, MultipartFile file);

    /**
     * Return the URL or path for accessing the stored file.
     * @param filePath  the relative path returned by {@link #upload}
     * @return          URL or path for client access
     */
    String presignedUrl(String filePath);

    /**
     * Permanently delete a stored file.
     * Only called when the {@link com.templeregistry.entity.document.Document} record is hard-deleted.
     */
    void delete(String filePath);
}
