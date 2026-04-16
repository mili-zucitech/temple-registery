package com.templeregistry.controller.export;

import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;
import com.templeregistry.service.export.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Jurisdiction-scoped data exports (CSV/PDF)")
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
