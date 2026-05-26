package com.templeregistry.controller.notice;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.notice.ChangeNoticeStatusRequest;
import com.templeregistry.dto.request.notice.CreateNoticeRequest;
import com.templeregistry.dto.request.notice.NoticeListFilter;
import com.templeregistry.dto.request.notice.UpdateNoticeRequest;
import com.templeregistry.dto.response.notice.NoticeListItemResponse;
import com.templeregistry.dto.response.notice.NoticeResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notice.NoticeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/notices")
@RequiredArgsConstructor
@Tag(name = "Notice Board", description = "Notice creation, management and retrieval")
public class NoticeController {

    private final NoticeService noticeService;

    // ── CRUD ─────────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a notice (DC or SA)")
    public ResponseEntity<ApiResponse<NoticeResponse>> create(@Valid @RequestBody CreateNoticeRequest request) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Notice created.", noticeService.createNotice(request, claims)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing notice")
    public ResponseEntity<ApiResponse<NoticeResponse>> update(@PathVariable Long id,
                                                               @Valid @RequestBody UpdateNoticeRequest request) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.ok(ApiResponse.success("Notice updated.", noticeService.updateNotice(id, request, claims)));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change the lifecycle status of a notice (archive, publish, etc.)")
    public ResponseEntity<ApiResponse<NoticeResponse>> changeStatus(@PathVariable Long id,
                                                                     @Valid @RequestBody ChangeNoticeStatusRequest request) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.ok(ApiResponse.success("Status updated.", noticeService.changeStatus(id, request, claims)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a notice")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        noticeService.deleteNotice(id, claims);
        return ResponseEntity.ok(ApiResponse.success("Notice deleted."));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get full notice detail (marks as read for TA)")
    public ResponseEntity<ApiResponse<NoticeResponse>> getById(@PathVariable Long id) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.ok(ApiResponse.success("Notice retrieved.", noticeService.getById(id, claims)));
    }

    // ── Role-specific lists ───────────────────────────────────────────────────

    @GetMapping("/dc")
    @Operation(summary = "Paginated notice list for DC (own district)")
    public ResponseEntity<ApiResponse<PaginatedResponse<NoticeListItemResponse>>> listForDc(
            NoticeListFilter filter,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.ok(ApiResponse.success("Notices retrieved.", noticeService.listForDc(filter, pageable, claims)));
    }

    @GetMapping("/admin")
    @Operation(summary = "Paginated notice list for SA (all districts)")
    public ResponseEntity<ApiResponse<PaginatedResponse<NoticeListItemResponse>>> listForAdmin(
            NoticeListFilter filter,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success("Notices retrieved.", noticeService.listForAdmin(filter, pageable)));
    }

    @GetMapping("/ta/dashboard")
    @Operation(summary = "Top-5 notices for TA dashboard widget")
    public ResponseEntity<ApiResponse<List<NoticeListItemResponse>>> listForTaDashboard() {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.ok(ApiResponse.success("Notices retrieved.", noticeService.listForTaDashboard(claims)));
    }

    // ── Attachments ───────────────────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a file attachment to a notice")
    public ResponseEntity<ApiResponse<NoticeResponse>> addAttachment(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attachment uploaded.", noticeService.addAttachment(id, file, claims)));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @Operation(summary = "Remove an attachment from a notice")
    public ResponseEntity<ApiResponse<Void>> removeAttachment(@PathVariable Long id,
                                                               @PathVariable Long attachmentId) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        noticeService.removeAttachment(id, attachmentId, claims);
        return ResponseEntity.ok(ApiResponse.success("Attachment removed."));
    }

    @GetMapping("/{id}/attachments/{attachmentId}/download")
    @Operation(summary = "Download a notice attachment")
    public ResponseEntity<Resource> download(@PathVariable Long id,
                                              @PathVariable Long attachmentId) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        Resource resource = noticeService.downloadAttachment(id, attachmentId, claims);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(resource.getFilename(), StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    @GetMapping("/{id}/attachments/{attachmentId}/preview")
    @Operation(summary = "Inline preview of a notice attachment")
    public ResponseEntity<Resource> preview(@PathVariable Long id,
                                             @PathVariable Long attachmentId) {
        ScopeHelper.Claims claims = ScopeHelper.Claims.fromContext();
        String mimeType = noticeService.getAttachmentMimeType(id, attachmentId, claims);
        Resource resource = noticeService.previewAttachment(id, attachmentId, claims);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(mimeType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(resource.getFilename(), StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }
}
