package com.templeregistry.controller.export;

import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.export.ExportService;
import org.springframework.security.core.context.SecurityContextHolder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Jurisdiction-scoped data exports (CSV/PDF)")
@PreAuthorize(RoleConstants.CAN_READ_ALL)
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/temples")
    @Operation(summary = "Export temple list as CSV or PDF")
    public ResponseEntity<byte[]> exportTemples(@Valid @RequestBody ExportTemplesRequest rq) {
        byte[] data = exportService.exportTemples(rq);
        String filename = "temples-export." + rq.getFormat().toLowerCase();
        return ResponseEntity.ok()
                .headers(buildHeaders(rq.getFormat(), filename))
                .body(data);
    }

    @PostMapping("/declarations")
    @Operation(summary = "Export asset declaration list as CSV or PDF")
    public ResponseEntity<byte[]> exportDeclarations(@Valid @RequestBody ExportDeclarationsRequest rq) {
        byte[] data = exportService.exportDeclarations(rq);
        String filename = "declarations-export." + rq.getFormat().toLowerCase();
        return ResponseEntity.ok()
                .headers(buildHeaders(rq.getFormat(), filename))
                .body(data);
    }

    @GetMapping("/evidence-pack/{templeId}")
    @Operation(summary = "Download evidence pack ZIP for a temple (AUDITOR/SUPER_ADMIN)")
    public ResponseEntity<byte[]> evidencePack(@PathVariable Long templeId) {
        Long actorId = currentUserId();
        byte[] zip = exportService.generateEvidencePack(templeId, actorId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/zip"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("evidence-pack-temple-" + templeId + ".zip").build());
        return ResponseEntity.ok().headers(headers).body(zip);
    }

    private Long currentUserId() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return p instanceof ScopeHelper.Claims c ? c.userId() : 0L;
    }

    private HttpHeaders buildHeaders(String format, String filename) {
        HttpHeaders headers = new HttpHeaders();
        
        if ("PDF".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.APPLICATION_PDF);
        } else {
            headers.setContentType(MediaType.parseMediaType("text/csv"));
        }
        
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return headers;
    }
}
