package com.templeregistry.service.impl.dc;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.dto.response.declaration.DeclarationVersionResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.ClarificationLimitExceededException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.DeclarationWorkflowService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.StatusTransitionValidatorCompat;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

/**
 * @deprecated Replaced by GovernanceWorkflowServiceImpl which routes all declaration workflow
 * actions through the canonical WorkflowEngine. This class is kept for reference only and is
 * excluded from the Spring context. Remove in a future cleanup sprint.
 */
@Deprecated(forRemoval = true)
@RequiredArgsConstructor
@Slf4j
public class DeclarationWorkflowServiceImpl implements DeclarationWorkflowService {

    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final AssetDeclarationVersionRepository versionRepository;
    private final TempleRepository templeRepository;
    private final JurisdictionGuard jurisdictionGuard;
    private final StatusTransitionValidatorCompat transitionValidator;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final NotificationEventPublisher notificationPublisher;
    private final com.templeregistry.service.notification.NotificationHelper notificationHelper;
    private final TempleSearchSummaryService summaryService;
    private final AuditService auditService;
    private final GovernanceAuditService governanceAuditService;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse approve(Long declarationId, WorkflowApproveRequest request,
                                          ScopeHelper.Claims claims) {
        AssetDeclaration d = loadWithLock(declarationId);
        Temple temple = loadTempleWithGeo(d.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.APPROVED.name());

        String ackNumber = ackGenerator.generate();

        d.setStatus(DeclarationStatus.APPROVED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(claims.userId());
        d.setAcknowledgementNumber(ackNumber);
        d.setAcknowledgedAt(LocalDateTime.now());
        d.setReviewComment(request.getRemarks());
        d.setAcknowledgementDocFilePath(generateAcknowledgementDocument(d, ackNumber, claims));
        declarationRepository.save(d);

        if (request.getRemarks() != null) {
            saveClarification(declarationId, request.getRemarks(), null, null, claims.userId(),
                    ClarificationDirection.DC_TO_TEMPLE);
        }

        // Send notification to all TAs for this temple
        notificationHelper.notifyDeclarationApproved(declarationId, d.getTempleId(), d.getFinancialYear(), claims.userId());

        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_APPROVED",
                "AssetDeclaration", declarationId,
                "ack=" + ackNumber);

        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "APPROVE",
                "Approved with acknowledgement: " + ackNumber + ". Remarks: " + request.getRemarks());

        summaryService.refresh(d.getTempleId());

        log.info("Declaration [{}] APPROVED by userId={} ack={}", declarationId, claims.userId(), ackNumber);

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.APPROVED.name())
                .acknowledgementNumber(ackNumber)
                .message("Declaration approved successfully. Acknowledgement: " + ackNumber)
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse reject(Long declarationId, WorkflowRejectRequest request,
                                         ScopeHelper.Claims claims) {
        AssetDeclaration d = loadWithLock(declarationId);
        Temple temple = loadTempleWithGeo(d.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.REJECTED.name());

        d.setStatus(DeclarationStatus.REJECTED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(claims.userId());
        declarationRepository.save(d);

        saveClarification(declarationId, request.getRemarks(), null, null, claims.userId(),
                ClarificationDirection.DC_TO_TEMPLE);

        // Send notification to all TAs for this temple
        notificationHelper.notifyDeclarationRejected(declarationId, d.getTempleId(), d.getFinancialYear(), claims.userId(), request.getRemarks());

        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_REJECTED",
                "AssetDeclaration", declarationId, "status=REJECTED");

        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "REJECT",
                "Rejected with remarks: " + request.getRemarks());

        summaryService.refresh(d.getTempleId());

        log.info("Declaration [{}] REJECTED by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.REJECTED.name())
                .acknowledgementNumber(null)
                .message("Declaration rejected.")
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse requestClarification(Long declarationId, DcClarifyRequest request,
                                                        ScopeHelper.Claims claims) {
        AssetDeclaration d = loadWithLock(declarationId);
        Temple temple = loadTempleWithGeo(d.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        if (d.getClarificationRound() >= 3) {
            throw new ClarificationLimitExceededException(
                    "Maximum clarification rounds reached. You must approve or reject this declaration.");
        }

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.CLARIFICATION_REQUIRED.name());

        d.setStatus(DeclarationStatus.CLARIFICATION_REQUIRED);
        d.setClarificationRound(d.getClarificationRound() + 1);
        declarationRepository.save(d);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        // Send notification to all TAs for this temple
        notificationHelper.notifyDeclarationFlagged(declarationId, d.getTempleId(), d.getFinancialYear(), claims.userId(), request.getMessage());

        auditService.logDataEvent(claims.userId(), claims.role(), "CLARIFICATION_REQUESTED",
                "AssetDeclaration", declarationId,
                "round=" + d.getClarificationRound());

        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "QUERY",
                "Clarification requested (round " + d.getClarificationRound() + "): " + request.getMessage());

        // EC-04: Escalation to Super Admin on round 2
        if (d.getClarificationRound() == 2) {
            userRepository.findAllByRole(UserRole.SUPER_ADMIN).forEach(sa ->
                    notificationPublisher.publish(sa.getId(), "CLARIFICATION_ESCALATION", declarationId, "ASSET_DECLARATION"));
        }

        summaryService.refresh(d.getTempleId());

        log.info("Clarification requested for declaration [{}] by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.CLARIFICATION_REQUIRED.name())
                .acknowledgementNumber(null)
                .message("Clarification requested from temple authority.")
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse flagPhysicalVerification(Long declarationId, DcClarifyRequest request,
                                                            ScopeHelper.Claims claims) {
        AssetDeclaration d = loadWithLock(declarationId);
        Temple temple = loadTempleWithGeo(d.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.SITE_VISIT_SCHEDULED.name());

        d.setStatus(DeclarationStatus.SITE_VISIT_SCHEDULED);
        declarationRepository.save(d);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        // Send notification to all TAs for this temple
        notificationHelper.notifyDeclarationMarkedForPhysicalVisit(declarationId, d.getTempleId(), d.getFinancialYear(), claims.userId(), null);

        auditService.logDataEvent(claims.userId(), claims.role(), "PHYSICAL_VERIFICATION_REQUESTED",
                "AssetDeclaration", declarationId, "flagged=true");

        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "FLAG",
                "Flagged for physical verification: " + request.getMessage());

        summaryService.refresh(d.getTempleId());

        log.info("Physical verification flagged for declaration [{}] by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.SITE_VISIT_SCHEDULED.name())
                .message("Declaration flagged for physical verification.")
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse markUnderReview(Long declarationId, ScopeHelper.Claims claims) {
        AssetDeclaration d = loadWithLock(declarationId);
        Temple temple = loadTempleWithGeo(d.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.UNDER_REVIEW.name());

        d.setStatus(DeclarationStatus.UNDER_REVIEW);
        declarationRepository.save(d);

        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_UNDER_REVIEW",
                "AssetDeclaration", declarationId, "userId=" + claims.userId());

        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "UNDER_REVIEW",
                "Marked as under review by DC");

        log.info("Declaration [{}] marked UNDER_REVIEW by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.UNDER_REVIEW.name())
                .message("Declaration marked as under review.")
                .build();
    }

    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public List<DeclarationVersionResponse> listVersions(Long declarationId) {
        AssetDeclaration declaration = findOrThrow(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());

        return versionRepository.findByDeclarationIdOrderByVersionNumberDesc(declarationId).stream()
                .map(version -> {
                    JsonNode snapshot = safeReadTree(version.getSnapshotJson());
                    return DeclarationVersionResponse.builder()
                            .id(version.getId())
                            .versionNumber(version.getVersionNumber())
                            .status(parseStatus(snapshot.path("status").asText(null)))
                            .submittedAt(parseDateTime(snapshot.path("submittedAt").asText(null)))
                            .reviewedAt(parseDateTime(snapshot.path("reviewedAt").asText(null)))
                            .acknowledgementNumber(text(snapshot, "acknowledgementNumber"))
                            .reviewedBy(snapshot.path("reviewedBy").isNull() ? null : snapshot.path("reviewedBy").asLong())
                            .remarks(text(snapshot, "remarks"))
                            .createdAt(version.getCreatedAt())
                            .build();
                })
                .toList();
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private AssetDeclaration findOrThrow(Long declarationId) {
        return declarationRepository.findById(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", declarationId));
    }

    private AssetDeclaration loadWithLock(Long declarationId) {
        return declarationRepository.findByIdWithLock(declarationId)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", declarationId));
    }

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    private void saveClarification(Long declarationId, String message, String sectionName,
                                   List<String> fieldNames, Long authorId,
                                   ClarificationDirection direction) {
        String fieldNamesJson = null;
        if (fieldNames != null && !fieldNames.isEmpty()) {
            try {
                fieldNamesJson = objectMapper.writeValueAsString(fieldNames);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize fieldNames for declarationId={}", declarationId);
            }
        }

        DeclarationClarification clarification = DeclarationClarification.builder()
                .declarationId(declarationId)
                .direction(direction)
                .message(message)
                .sectionName(sectionName)
                .fieldNamesJson(fieldNamesJson)
                .authorId(authorId)
                .build();

        clarificationRepository.save(clarification);
    }

    private String generateAcknowledgementDocument(AssetDeclaration declaration, String acknowledgementNumber,
                                                   ScopeHelper.Claims claims) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfWriter writer = new PdfWriter(output);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);
            document.add(new Paragraph("Temple Registry - Asset Declaration Acknowledgement"));
            document.add(new Paragraph("Acknowledgement Number: " + acknowledgementNumber));
            document.add(new Paragraph("Declaration ID: " + declaration.getId()));
            document.add(new Paragraph("Temple ID: " + declaration.getTempleId()));
            document.add(new Paragraph("Financial Year: " + declaration.getFinancialYear()));
            document.add(new Paragraph("Status: " + declaration.getStatus()));
            document.add(new Paragraph("Reviewed By: " + claims.userId()));
            document.add(new Paragraph("Reviewed At: " + LocalDateTime.now()));
            document.add(new Paragraph("Remarks: " + (declaration.getReviewComment() == null ? "" : declaration.getReviewComment())));
            document.close();
            String filename = "acknowledgement-" + acknowledgementNumber + ".pdf";
            return fileStorageService.uploadBytes("declarations/acknowledgements", filename, output.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to generate acknowledgement document.", ex);
        }
    }

    private JsonNode safeReadTree(String json) {
        try {
            return json == null ? objectMapper.getNodeFactory().nullNode() : objectMapper.readTree(json);
        } catch (Exception ex) {
            return objectMapper.getNodeFactory().nullNode();
        }
    }

    private DeclarationStatus parseStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return DeclarationStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return LocalDateTime.parse(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims claims) {
            return claims;
        }
        throw new IllegalStateException("No authenticated claims available.");
    }
}
