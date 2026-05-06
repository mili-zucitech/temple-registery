package com.templeregistry.controller.document;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.document.DocumentUrlResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.document.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Upload and retrieve supporting documents stored in S3")
@PreAuthorize(RoleConstants.CAN_READ_ALL + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document (PDF/JPG/PNG, max 5 MB)")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestParam String ownerType,
            @RequestParam Long ownerId,
            @RequestParam(required = false) Long referenceId,
            @RequestParam(required = false) String label,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document uploaded.",
                        documentService.upload(ownerType, ownerId, referenceId, label, file)));
    }

    @GetMapping("/download")
    @Operation(summary = "Download a file by its storage key. Access control enforced at service level.")
    public ResponseEntity<Resource> downloadByKey(@RequestParam String key) {
        Resource resource = documentService.downloadByKey(key);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + key + "\"")
                .body(resource);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document metadata by ID")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Document retrieved.", documentService.getById(id)));
    }

    @GetMapping("/{id}/url")
    @Operation(summary = "Get a 15-minute pre-signed download URL")
    public ResponseEntity<ApiResponse<DocumentUrlResponse>> getUrl(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("URL generated.", documentService.getPresignedUrl(id)));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "Directly download a document by its ID. Access control enforced at service level.")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Resource resource = documentService.download(id);
        DocumentResponse doc = documentService.getById(id);
        return buildDownloadResponse(resource, doc.getOriginalFilename(), doc.getMimeType());
    }

    @GetMapping("/{id}/preview")
    @Operation(summary = "Preview a document by its ID (opens in browser instead of downloading). Access control enforced at service level.")
    public ResponseEntity<Resource> preview(@PathVariable Long id) {
        Resource resource = documentService.download(id);
        DocumentResponse doc = documentService.getById(id);
        return buildPreviewResponse(resource, doc.getOriginalFilename(), doc.getMimeType());
    }

   
    private ResponseEntity<Resource> buildDownloadResponse(Resource resource, String filename, String mimeType) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(resource);
    }

    private ResponseEntity<Resource> buildPreviewResponse(Resource resource, String filename, String mimeType) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @GetMapping
    @Operation(summary = "List documents for an owner entity (paginated)")
    public ResponseEntity<ApiResponse<PaginatedResponse<DocumentResponse>>> listByOwner(
            @RequestParam String ownerType,
            @RequestParam Long ownerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success("Documents retrieved.",
                documentService.listByOwner(ownerType, ownerId, page, size)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a document record (S3 object retained for audit)")
    @PreAuthorize(RoleConstants.ADMIN_ONLY + " or " + RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
