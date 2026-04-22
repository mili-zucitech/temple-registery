package com.templeregistry.service.impl.document;

import com.templeregistry.exception.FileValidationException;
import com.templeregistry.service.document.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@Slf4j
public class LocalFileStorageServiceImpl implements FileStorageService {

    @Value("${app.storage.base-dir:./uploads}")
    private String baseDir;

    @Override
    public String upload(String folder, MultipartFile file) {
        String sanitized = sanitize(file.getOriginalFilename());
        String relativePath = folder + "/" + UUID.randomUUID() + "_" + sanitized;
        Path base = Path.of(baseDir).toAbsolutePath().normalize();
        Path target = base.resolve(relativePath).normalize();

        if (!target.startsWith(base)) {
            throw new FileValidationException("Invalid file path detected");
        }

        try {
            Files.createDirectories(target.getParent());
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved file locally: path=[{}]", relativePath);
            return relativePath;
        } catch (IOException e) {
            throw new FileValidationException("Failed to store file: " + e.getMessage());
        }
    }

    @Override
    public String uploadBytes(String folder, String filename, byte[] content) {
        String sanitized = sanitize(filename);
        String relativePath = folder + "/" + UUID.randomUUID() + "_" + sanitized;
        Path base = Path.of(baseDir).toAbsolutePath().normalize();
        Path target = base.resolve(relativePath).normalize();

        if (!target.startsWith(base)) {
            throw new FileValidationException("Invalid file path detected");
        }

        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content);
            log.info("Saved generated file locally: path=[{}]", relativePath);
            return relativePath;
        } catch (IOException e) {
            throw new FileValidationException("Failed to store generated file: " + e.getMessage());
        }
    }

    @Override
    public String presignedUrl(String filePath) {
        // Return null/empty as-is
        if (filePath == null || filePath.isBlank()) {
            return filePath;
        }
        
        // If already a presigned URL, extract the key and rebuild (handles recursive wrapping)
        if (filePath.startsWith("/api/v1/documents/download?key=")) {
            // Extract the key parameter value
            String key = filePath.substring("/api/v1/documents/download?key=".length());
            
            // If the key itself contains the presigned URL pattern (recursive wrapping), extract again
            while (key.startsWith("/api/v1/documents/download?key=")) {
                key = key.substring("/api/v1/documents/download?key=".length());
            }
            
            // Return properly formatted presigned URL with clean key
            return "/api/v1/documents/download?key=" + key;
        }
        
        // Otherwise, convert raw file path to presigned URL
        return "/api/v1/documents/download?key=" + filePath;
    }

    @Override
    public Resource loadAsResource(String filePath) {
        Path base = Path.of(baseDir).toAbsolutePath().normalize();
        Path target = base.resolve(filePath).normalize();

        if (!target.startsWith(base)) {
            log.warn("Path traversal attempt blocked on load: [{}]", filePath);
            throw new FileValidationException("Invalid file path");
        }

        Resource resource = new FileSystemResource(target);
        if (!resource.exists()) {
            log.warn("File not found: [{}]", target);
            throw new FileValidationException("File not found");
        }
        return resource;
    }

    @Override
    public void delete(String filePath) {
        Path base = Path.of(baseDir).toAbsolutePath().normalize();
        Path target = base.resolve(filePath).normalize();

        if (!target.startsWith(base)) {
            log.warn("Path traversal attempt blocked on delete: [{}]", filePath);
            return;
        }

        try {
            Files.deleteIfExists(target);
            log.info("Deleted local file: path=[{}]", filePath);
        } catch (IOException e) {
            log.warn("Could not delete local file [{}]: {}", filePath, e.getMessage());
        }
    }

    private String sanitize(String filename) {
        if (filename == null) return "upload";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
