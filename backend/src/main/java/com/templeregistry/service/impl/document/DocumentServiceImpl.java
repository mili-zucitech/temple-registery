package com.templeregistry.service.impl.document;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.document.DocumentUrlResponse;
import com.templeregistry.entity.document.Document;
import com.templeregistry.entity.document.DocumentAccessLog;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.FileValidationException;
import com.templeregistry.repository.document.DocumentAccessLogRepository;
import com.templeregistry.repository.document.DocumentRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.document.DocumentService;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentServiceImpl implements DocumentService {

    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024L; // 5 MB
    private static final Set<String> ALLOWED_MIME = Set.of(
            "image/jpeg", "image/png", "application/pdf");

    private final DocumentRepository documentRepository;
    private final DocumentAccessLogRepository accessLogRepository;
    private final FileStorageService fileStorageService;
    private final PaginationUtil paginationUtil;

    @Override
    @Transactional
    public DocumentResponse upload(String ownerType, Long ownerId, Long referenceId, String label,
                                   MultipartFile file) {
        validateFile(file);
        String folder = ownerType.toLowerCase() + "/" + ownerId + "/docs";
        String s3Key = fileStorageService.upload(folder, file);
        Document doc = Document.builder()
                .ownerType(ownerType).ownerId(ownerId).referenceId(referenceId)
                .originalFilename(file.getOriginalFilename())
                .s3Key(s3Key).mimeType(file.getContentType())
                .fileSizeBytes(file.getSize()).documentLabel(label).build();
        Document saved = documentRepository.save(doc);
        log.info("Document saved: id=[{}] key=[{}]", saved.getId(), s3Key);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @Transactional
    public DocumentUrlResponse getPresignedUrl(Long id) {
        Document doc = findOrThrow(id);
        String url = fileStorageService.presignedUrl(doc.getS3Key());
        recordAccess(id, "DOWNLOAD");
        return DocumentUrlResponse.builder()
                .documentId(id).url(url).expiresIn("15 minutes")
                .generatedAt(LocalDateTime.now()).build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<DocumentResponse> listByOwner(String ownerType, Long ownerId,
                                                            int page, int size) {
        Page<Document> result = documentRepository.findAllByOwnerTypeAndOwnerId(
                ownerType, ownerId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @Transactional
    public void softDelete(Long id) {
        findOrThrow(id);
        documentRepository.deleteById(id); // @SQLDelete intercepts → UPDATE is_deleted = true
    }

    @Override
    @Transactional
    public DocumentResponse registerExternalUpload(String ownerType, Long ownerId, String label,
                                                    String s3Key, String mimeType,
                                                    long fileSizeBytes, String originalFilename) {
        validateExternalUpload(mimeType, fileSizeBytes);
        Document doc = Document.builder()
                .ownerType(ownerType).ownerId(ownerId).referenceId(null)
                .originalFilename(originalFilename)
                .s3Key(s3Key).mimeType(mimeType)
                .fileSizeBytes(fileSizeBytes).documentLabel(label).build();
        Document saved = documentRepository.save(doc);
        log.info("External document registered: id=[{}] owner=[{}/{}]", saved.getId(), ownerType, ownerId);
        return toResponse(saved);
    }

    private void validateExternalUpload(String mimeType, long fileSizeBytes) {
        if (!ALLOWED_MIME.contains(mimeType)) {
            throw new FileValidationException("Unsupported file type. Allowed: PDF, JPEG, PNG.");
        }
        // Document uploads for TA are max 10 MB (VAL-005); photo uploads are max 5 MB (VAL-006)
        long maxDocumentBytes = 10 * 1024 * 1024L;
        if (fileSizeBytes > maxDocumentBytes) {
            throw new FileValidationException("File exceeds maximum allowed size of 10 MB.");
        }
        if (fileSizeBytes <= 0) {
            throw new FileValidationException("File size must be positive.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("File must not be empty.");
        }
        if (!ALLOWED_MIME.contains(file.getContentType())) {
            throw new FileValidationException("Unsupported file type. Allowed: PDF, JPEG, PNG.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new FileValidationException("File exceeds maximum allowed size of 5 MB.");
        }
    }

    private void recordAccess(Long documentId, String accessType) {
        ScopeHelper.Claims claims = currentClaims();
        accessLogRepository.save(DocumentAccessLog.builder()
                .documentId(documentId).accessorId(claims.userId())
                .accessorRole(claims.role()).accessType(accessType).build());
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("No authenticated claims in security context.");
    }

    private Document findOrThrow(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Document", id));
    }

    private DocumentResponse toResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId()).ownerType(d.getOwnerType()).ownerId(d.getOwnerId())
                .originalFilename(d.getOriginalFilename()).mimeType(d.getMimeType())
                .fileSizeBytes(d.getFileSizeBytes()).documentLabel(d.getDocumentLabel())
                .createdAt(d.getCreatedAt()).build();
    }
}
