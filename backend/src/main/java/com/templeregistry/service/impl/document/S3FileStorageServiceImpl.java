package com.templeregistry.service.impl.document;

import com.templeregistry.exception.FileValidationException;
import com.templeregistry.service.document.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3FileStorageServiceImpl implements FileStorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket-name}")
    private String bucketName;

    @Value("${app.storage.presigned-url-expiry-minutes:15}")
    private int presignedUrlExpiryMinutes;

    @Override
    public String upload(String folder, MultipartFile file) {
        String key = folder + "/" + UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        try (InputStream is = file.getInputStream()) {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName).key(key)
                    .contentType(file.getContentType())
                    .contentLength(file.getSize())
                    .build();
            s3Client.putObject(request, RequestBody.fromInputStream(is, file.getSize()));
            log.info("Uploaded to S3: key=[{}]", key);
            return key;
        } catch (IOException e) {
            throw new FileValidationException("Failed to upload file to storage: " + e.getMessage());
        }
    }

    @Override
    public String presignedUrl(String s3Key) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(presignedUrlExpiryMinutes))
                .getObjectRequest(r -> r.bucket(bucketName).key(s3Key).build())
                .build();
        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);
        return presigned.url().toString();
    }

    @Override
    public void delete(String s3Key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(s3Key).build());
        log.info("Deleted from S3: key=[{}]", s3Key);
    }

    private String sanitize(String filename) {
        if (filename == null) return "upload";
        return filename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
