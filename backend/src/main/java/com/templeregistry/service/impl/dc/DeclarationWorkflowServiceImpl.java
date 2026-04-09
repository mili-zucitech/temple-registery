package com.templeregistry.service.impl.dc;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.DeclarationWorkflowService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.StatusTransitionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Executes DC workflow actions on asset declarations.
 *
 * Each action:
 *  1. Loads declaration with PESSIMISTIC_WRITE lock (prevents concurrent mutations)
 *  2. Loads temple with geo chain (EntityGraph) for district scope assertion
 *  3. Validates status transition
 *  4. Applies state change + persists
 *  5. Persists clarification record (clarify / flag actions)
 *  6. Generates acknowledgement number (approve only)
 *  7. Publishes in-transaction NotificationEvent (propagation=REQUIRED — rolls back with tx)
 *  8. Fires async audit log (fire-and-forget, independent transaction)
 *  9. Calls TempleSearchSummaryService.refresh() in same transaction (2.6)
 *
 * dc_e2e Sections 3.3, 2.6, 2.7, 2.8.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationWorkflowServiceImpl implements DeclarationWorkflowService {

    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final TempleRepository templeRepository;
    private final JurisdictionGuard jurisdictionGuard;
    private final StatusTransitionValidator transitionValidator;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final NotificationEventPublisher notificationPublisher;
    private final TempleSearchSummaryService summaryService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

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
        declarationRepository.save(d);

        if (request.getRemarks() != null) {
            saveClarification(declarationId, request.getRemarks(), null, null, claims.userId(),
                    ClarificationDirection.DC_TO_TEMPLE);
        }

        notificationPublisher.publish(
                d.getSubmittedBy(), "DECLARATION_APPROVED", declarationId, "ASSET_DECLARATION");

        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_APPROVED",
                "AssetDeclaration", declarationId,
                "ack=" + ackNumber);

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

        notificationPublisher.publish(
                d.getSubmittedBy(), "DECLARATION_REJECTED", declarationId, "ASSET_DECLARATION");

        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_REJECTED",
                "AssetDeclaration", declarationId, "status=REJECTED");

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

        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.CLARIFICATION_REQUESTED.name());

        d.setStatus(DeclarationStatus.CLARIFICATION_REQUESTED);
        d.setClarificationRound(d.getClarificationRound() + 1);
        declarationRepository.save(d);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        notificationPublisher.publish(
                d.getSubmittedBy(), "CLARIFICATION_REQUESTED", declarationId, "ASSET_DECLARATION");

        auditService.logDataEvent(claims.userId(), claims.role(), "CLARIFICATION_REQUESTED",
                "AssetDeclaration", declarationId,
                "round=" + d.getClarificationRound());

        summaryService.refresh(d.getTempleId());

        log.info("Clarification requested for declaration [{}] by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.CLARIFICATION_REQUESTED.name())
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
                d.getStatus().name(), DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name());

        d.setStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED);
        declarationRepository.save(d);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        notificationPublisher.publish(
                d.getSubmittedBy(), "PHYSICAL_VERIFICATION_REQUESTED", declarationId, "ASSET_DECLARATION");

        auditService.logDataEvent(claims.userId(), claims.role(), "PHYSICAL_VERIFICATION_REQUESTED",
                "AssetDeclaration", declarationId, null);

        summaryService.refresh(d.getTempleId());

        log.info("Physical verification flagged for declaration [{}] by userId={}", declarationId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name())
                .acknowledgementNumber(null)
                .message("Physical verification requested.")
                .build();
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

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
}
