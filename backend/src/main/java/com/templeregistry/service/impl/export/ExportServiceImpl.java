package com.templeregistry.service.impl.export;

import com.opencsv.CSVWriter;
import com.templeregistry.util.pdf.ExportReportTemplate;
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
import java.io.OutputStream;
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
            List<String[]> rows = buildTempleRows(temples);
            data = ExportReportTemplate.builder()
                .title("Temple Export Report")
                .districtLabel(districtId != null ? "District #" + districtId : "All Districts")
                .generatedBy(claims.role() + " / User #" + claims.userId())
                .rows(rows)
                .totalCount(rows.size() - 1)
                .build()
                .render();
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
            List<String[]> rows = buildDeclarationRows(declarations);
            data = ExportReportTemplate.builder()
                .title("Declaration Export Report")
                .districtLabel(districtId != null ? "District #" + districtId : "All Districts")
                .generatedBy(claims.role() + " / User #" + claims.userId())
                .rows(rows)
                .totalCount(rows.size() - 1)
                .build()
                .render();
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

    // ─── Evidence Pack ────────────────────────────────────────────────────────

    @Override
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','DISTRICT_COLLECTOR','DC_STAFF','AUDITOR')")
    @Transactional(readOnly = true)
    public byte[] generateEvidencePack(Long templeId, Long actorId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new com.templeregistry.exception.EntityNotFoundException("Temple", templeId));

        try (ByteArrayOutputStream zipBaos = new ByteArrayOutputStream();
             java.util.zip.ZipOutputStream zip = new java.util.zip.ZipOutputStream(zipBaos)) {

            // Temple profile summary
            addJsonEntry(zip, "temple_profile.json", toJson(temple));

            // Declarations (non-draft, last 100)
            List<AssetDeclaration> declarations = declarationRepository.findAllByTempleId(
                    templeId, PageRequest.of(0, 100)).getContent();
            addJsonEntry(zip, "declarations.json", toJson(declarations));

            zip.finish();
            auditService.logDataEvent(actorId, "N/A", "GENERATE_EVIDENCE_PACK",
                    "TEMPLE", templeId, "templeId=" + templeId);
            log.info("Evidence pack generated for templeId={} by actorId={}", templeId, actorId);
            return zipBaos.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate evidence pack for templeId=" + templeId, e);
        }
    }

    private void addJsonEntry(java.util.zip.ZipOutputStream zip, String name, String json) throws IOException {
        zip.putNextEntry(new java.util.zip.ZipEntry(name));
        zip.write(json.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    private String toJson(Object obj) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                    .findAndRegisterModules()
                    .writeValueAsString(obj);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return "{}";
        }
    }
}
