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
    @Operation(summary = "Export temple list as CSV")
    public ResponseEntity<byte[]> exportTemples(@Valid @RequestBody ExportTemplesRequest rq) {
        byte[] data = exportService.exportTemples(rq);
        return ResponseEntity.ok()
                .headers(csvHeaders("temples-export.csv"))
                .body(data);
    }

    @PostMapping("/declarations")
    @Operation(summary = "Export asset declaration list as CSV")
    public ResponseEntity<byte[]> exportDeclarations(@Valid @RequestBody ExportDeclarationsRequest rq) {
        byte[] data = exportService.exportDeclarations(rq);
        return ResponseEntity.ok()
                .headers(csvHeaders("declarations-export.csv"))
                .body(data);
    }

    private HttpHeaders csvHeaders(String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return headers;
    }
}
