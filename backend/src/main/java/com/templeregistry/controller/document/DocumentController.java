package com.templeregistry.controller.document;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.document.DocumentUrlResponse;
import com.templeregistry.service.document.DocumentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Upload and retrieve supporting documents stored in S3")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a document (PDF/JPG/PNG, max 5 MB)")
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
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        documentService.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
