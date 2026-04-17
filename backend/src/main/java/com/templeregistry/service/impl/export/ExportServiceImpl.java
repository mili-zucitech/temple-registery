package com.templeregistry.service.impl.export;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.opencsv.CSVWriter;
import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.export.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportServiceImpl implements ExportService {

    private static final int EXPORT_MAX = 5000;

    private final TempleRepository templeRepository;
    private final DeclarationRepository declarationRepository;
    private final AuditService auditService;
    private final JurisdictionGuard jurisdictionGuard;

    @Override
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','DISTRICT_COLLECTOR','DC_STAFF','AUDITOR')")
    @Transactional(readOnly = true)
    public byte[] exportTemples(ExportTemplesRequest rq) {
        ScopeHelper.Claims claims = currentClaims();
        Long districtId = jurisdictionGuard.enforceDistrictId(rq.getDistrictId());

        List<Temple> temples = districtId != null
                ? templeRepository.findAllByDistrictId(districtId, PageRequest.of(0, EXPORT_MAX)).getContent()
                : templeRepository.findAll(PageRequest.of(0, EXPORT_MAX)).getContent();

        byte[] data;
        if ("PDF".equalsIgnoreCase(rq.getFormat())) {
            data = generatePdf(buildTempleRows(temples), "Temple Export");
        } else {
            data = generateCsv(buildTempleRows(temples));
        }
        
        auditService.logExportEvent(claims.userId(), claims.role(),
                "TEMPLES_" + rq.getFormat(), "districtId=" + districtId, temples.size());
        return data;
    }

    @Override
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','DISTRICT_COLLECTOR','DC_STAFF','AUDITOR')")
    @Transactional(readOnly = true)
    public byte[] exportDeclarations(ExportDeclarationsRequest rq) {
        ScopeHelper.Claims claims = currentClaims();
        Long districtId = jurisdictionGuard.enforceDistrictId(rq.getDistrictId());

        DeclarationStatus status = rq.getStatus() != null
                ? DeclarationStatus.valueOf(rq.getStatus()) : null;
        List<AssetDeclaration> declarations;
        if (status != null) {
            declarations = districtId != null
                    ? declarationRepository.findAllByDistrictIdAndStatus(districtId, status, PageRequest.of(0, EXPORT_MAX)).getContent()
                    : declarationRepository.findAllByStatus(status, PageRequest.of(0, EXPORT_MAX)).getContent();
        } else {
            declarations = districtId != null
                    ? declarationRepository.findAllByDistrictId(districtId, PageRequest.of(0, EXPORT_MAX)).getContent()
                    : declarationRepository.findAll(PageRequest.of(0, EXPORT_MAX)).getContent();
        }

        byte[] data;
        if ("PDF".equalsIgnoreCase(rq.getFormat())) {
            data = generatePdf(buildDeclarationRows(declarations), "Declaration Export");
        } else {
            data = generateCsv(buildDeclarationRows(declarations));
        }
        
        auditService.logExportEvent(claims.userId(), claims.role(),
                "DECLARATIONS_" + rq.getFormat(), "districtId=" + districtId + " status=" + rq.getStatus(),
                declarations.size());
        return data;
    }

    private byte[] generateCsv(List<String[]> rows) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
             CSVWriter writer = new CSVWriter(new OutputStreamWriter(bos, StandardCharsets.UTF_8))) {
            writer.writeAll(rows);
            writer.flush();
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("CSV generation failed.", e);
        }
    }

    private byte[] generatePdf(List<String[]> rows, String title) {
        try (ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(bos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Add title
            document.add(new Paragraph(title).setFontSize(18).setBold());
            document.add(new Paragraph("Generated on: " + java.time.LocalDateTime.now().toString()).setFontSize(10));
            document.add(new Paragraph("\n"));

            // Add table
            if (!rows.isEmpty()) {
                String[] headers = rows.get(0);
                Table table = new Table(headers.length);
                
                // Add header row
                for (String header : headers) {
                    table.addHeaderCell(new Cell().add(new Paragraph(header).setBold()));
                }
                
                // Add data rows
                for (int i = 1; i < rows.size(); i++) {
                    for (String cell : rows.get(i)) {
                        table.addCell(new Cell().add(new Paragraph(cell)));
                    }
                }
                
                document.add(table);
            }

            document.close();
            return bos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("PDF generation failed.", e);
        }
    }

    private List<String[]> buildTempleRows(List<Temple> temples) {
        var rows = new java.util.ArrayList<String[]>();
        rows.add(new String[]{"ID", "Name", "Grade", "Tradition", "District ID", "Trust Registered"});
        for (Temple t : temples) {
            rows.add(new String[]{
                    String.valueOf(t.getId()), t.getName(),
                    t.getGrade() != null ? t.getGrade().name() : "",
                    t.getTradition() != null ? t.getTradition().name() : "",
                    String.valueOf(t.getDistrictId()),
                    String.valueOf(t.isTrustRegistered())
            });
        }
        return rows;
    }

    private List<String[]> buildDeclarationRows(List<AssetDeclaration> declarations) {
        var rows = new java.util.ArrayList<String[]>();
        rows.add(new String[]{"ID", "Temple ID", "District ID", "Status", "Ack Number", "Submitted At"});
        for (AssetDeclaration d : declarations) {
            rows.add(new String[]{
                    String.valueOf(d.getId()), String.valueOf(d.getTempleId()),
                    String.valueOf(d.getDistrictId()), d.getStatus().name(),
                    d.getAcknowledgementNumber() != null ? d.getAcknowledgementNumber() : "",
                    d.getSubmittedAt() != null ? d.getSubmittedAt().toString() : ""
            });
        }
        return rows;
    }

    private ScopeHelper.Claims currentClaims() {
        Object p = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return (ScopeHelper.Claims) p;
    }
}
