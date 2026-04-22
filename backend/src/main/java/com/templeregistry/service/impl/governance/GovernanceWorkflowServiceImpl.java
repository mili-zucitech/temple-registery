package com.templeregistry.service.impl.governance;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.dc.DcClarifyRequest;
import com.templeregistry.dto.request.dc.WorkflowApproveRequest;
import com.templeregistry.dto.request.dc.WorkflowRejectRequest;
import com.templeregistry.dto.request.governance.OrderPhysicalVerificationRequest;
import com.templeregistry.dto.request.governance.RejectRequest;
import com.templeregistry.dto.request.governance.SendBackRequest;
import com.templeregistry.dto.request.governance.UpdatePhysicalVerificationRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.dto.response.governance.PhysicalVerificationHistoryResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.PhysicalVerificationHistory;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.ClarificationLimitExceededException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.governance.PhysicalVerificationHistoryRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.governance.GovernanceWorkflowService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.StatusTransitionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GovernanceWorkflowServiceImpl implements GovernanceWorkflowService {

    private final TrustRepository trustRepository;
    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final TempleRepository templeRepository;
    private final PhysicalVerificationHistoryRepository physicalVerificationHistoryRepository;
    private final GovernanceAuditService governanceAuditService;
    private final AuditService auditService;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final NotificationEventPublisher notificationPublisher;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final StatusTransitionValidator transitionValidator;
    private final TempleSearchSummaryService summaryService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // =========================================================================
    // TRUST — Submit / Approve / Send Back / Reject
    // =========================================================================

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public void submitTrust(Long trustId) {
        Trust trust = loadTrust(trustId);
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        assertCanSubmit(trust.getSubmissionStatus(), "Trust", trustId);

        trust.setSubmissionStatus(SubmissionStatus.SUBMITTED);
        trust.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
        trust.setSendBackReason(null);
        trust.setGovernanceVersion(trust.getGovernanceVersion() + 1);
        trustRepository.save(trust);

        notifyDcOfSubmission(trust.getTempleId(), "TRUST", trustId);
        governanceAuditService.logAction(trustId, "TRUST", currentUserId(), "SUBMIT",
                "Trust submitted for DC approval.");
        log.info("Trust [{}] submitted by userId={}", trustId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void approveTrust(Long trustId) {
        Trust trust = loadTrust(trustId);
        assertDcCanAct(trust.getSubmissionStatus(), "Trust", trustId);
        assertDistrictScopeForTrust(trust);

        trust.setSubmissionStatus(SubmissionStatus.APPROVED);
        trust.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC);
        trust.setGovernanceVersion(trust.getGovernanceVersion() + 1);
        trustRepository.save(trust);

        notifyTaOfDecision(trust.getTempleId(), "TRUST", trustId, "APPROVED", null);
        governanceAuditService.logAction(trustId, "TRUST", currentUserId(), "APPROVE",
                "Trust approved by DC.");
        log.info("Trust [{}] APPROVED by userId={}", trustId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void sendBackTrust(Long trustId, SendBackRequest request) {
        Trust trust = loadTrust(trustId);
        assertDcCanAct(trust.getSubmissionStatus(), "Trust", trustId);
        assertDistrictScopeForTrust(trust);

        trust.setSubmissionStatus(SubmissionStatus.SENT_BACK);
        trust.setSendBackReason(request.getReason());
        trust.setGovernanceVersion(trust.getGovernanceVersion() + 1);
        trustRepository.save(trust);

        notifyTaOfDecision(trust.getTempleId(), "TRUST", trustId, "SENT_BACK", request.getReason());
        governanceAuditService.logAction(trustId, "TRUST", currentUserId(), "SEND_BACK",
                request.getReason());
        log.info("Trust [{}] SENT_BACK by userId={}", trustId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void rejectTrust(Long trustId, RejectRequest request) {
        Trust trust = loadTrust(trustId);
        assertDcCanAct(trust.getSubmissionStatus(), "Trust", trustId);
        assertDistrictScopeForTrust(trust);

        trust.setSubmissionStatus(SubmissionStatus.REJECTED);
        trust.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);
        trust.setGovernanceVersion(trust.getGovernanceVersion() + 1);
        trustRepository.save(trust);

        notifyTaOfDecision(trust.getTempleId(), "TRUST", trustId, "REJECTED", request.getReason());
        governanceAuditService.logAction(trustId, "TRUST", currentUserId(), "REJECT",
                request.getReason());
        log.info("Trust [{}] REJECTED by userId={}", trustId, currentUserId());
    }

    // =========================================================================
    // DECLARATION — Submit / Approve / Send Back / Reject
    // =========================================================================

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public void submitDeclaration(Long declarationId) {
        AssetDeclaration declaration = loadDeclaration(declarationId);
        ownershipGuard.assertOwnsTemple(declaration.getTempleId());
        assertCanSubmit(declaration.getSubmissionStatus(), "AssetDeclaration", declarationId);

        declaration.setSubmissionStatus(SubmissionStatus.SUBMITTED);
        declaration.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
        declaration.setSendBackReason(null);
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);
        declarationRepository.save(declaration);

        notifyDcOfSubmission(declaration.getTempleId(), "ASSET_DECLARATION", declarationId);
        governanceAuditService.logAction(declarationId, "DECLARATION", currentUserId(), "SUBMIT",
                "Declaration submitted for DC approval.");
        log.info("Declaration [{}] submitted by userId={}", declarationId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse approveDeclaration(Long declarationId, WorkflowApproveRequest request,
                                                      ScopeHelper.Claims claims) {
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Validate legacy DeclarationStatus transition
        transitionValidator.validateDeclarationTransition(
                declaration.getStatus().name(), DeclarationStatus.APPROVED.name());

        // BLOCK: DC must NOT approve if physical verification has failed
        if (PhysicalVerificationStatus.VERIFICATION_FAILED.equals(declaration.getPhysicalVerificationStatus())) {
            throw new IllegalStatusTransitionException(
                    "Cannot approve declaration [" + declarationId + "]: physical verification has FAILED. " +
                    "Resolve the verification failure before approving.");
        }

        // Update both status fields for full consistency
        declaration.setStatus(DeclarationStatus.APPROVED);
        declaration.setSubmissionStatus(SubmissionStatus.APPROVED);
        declaration.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC);
        declaration.setReviewedAt(LocalDateTime.now());
        declaration.setReviewedBy(claims.userId());
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);

        String ackNumber = ackGenerator.generate();
        declaration.setAcknowledgementNumber(ackNumber);
        declaration.setAcknowledgedAt(LocalDateTime.now());
        declarationRepository.save(declaration);

        if (request != null && request.getRemarks() != null) {
            saveClarification(declarationId, request.getRemarks(), null, null,
                    claims.userId(), ClarificationDirection.DC_TO_TEMPLE);
        }

        notificationPublisher.publish(declaration.getSubmittedBy(), "DECLARATION_APPROVED",
                declarationId, "ASSET_DECLARATION");
        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_APPROVED",
                "AssetDeclaration", declarationId, "ack=" + ackNumber);
        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "APPROVE",
                "Approved with acknowledgement: " + ackNumber +
                ". PhysicalVerificationStatus=" + declaration.getPhysicalVerificationStatus());
        summaryService.refresh(declaration.getTempleId());

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
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void sendBackDeclaration(Long declarationId, SendBackRequest request) {
        AssetDeclaration declaration = loadDeclaration(declarationId);
        assertDcCanAct(declaration.getSubmissionStatus(), "AssetDeclaration", declarationId);
        jurisdictionGuard.assertSameDistrict(declaration.getDistrictId());

        declaration.setSubmissionStatus(SubmissionStatus.SENT_BACK);
        declaration.setSendBackReason(request.getReason());
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);
        declarationRepository.save(declaration);

        notifyTaOfDecision(declaration.getTempleId(), "ASSET_DECLARATION", declarationId, "SENT_BACK",
                request.getReason());
        governanceAuditService.logAction(declarationId, "DECLARATION", currentUserId(), "SEND_BACK",
                request.getReason());
        log.info("Declaration [{}] SENT_BACK by userId={}", declarationId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse rejectDeclaration(Long declarationId, WorkflowRejectRequest request,
                                                     ScopeHelper.Claims claims) {
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                declaration.getStatus().name(), DeclarationStatus.REJECTED.name());

        declaration.setStatus(DeclarationStatus.REJECTED);
        declaration.setSubmissionStatus(SubmissionStatus.REJECTED);
        declaration.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);
        declaration.setReviewedAt(LocalDateTime.now());
        declaration.setReviewedBy(claims.userId());
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);
        declarationRepository.save(declaration);

        saveClarification(declarationId, request.getRemarks(), null, null,
                claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        notificationPublisher.publish(declaration.getSubmittedBy(), "DECLARATION_REJECTED",
                declarationId, "ASSET_DECLARATION");
        auditService.logDataEvent(claims.userId(), claims.role(), "DECLARATION_REJECTED",
                "AssetDeclaration", declarationId, "status=REJECTED");
        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "REJECT",
                "Rejected with remarks: " + request.getRemarks());
        summaryService.refresh(declaration.getTempleId());

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
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse requestClarification(Long declarationId, DcClarifyRequest request,
                                                        ScopeHelper.Claims claims) {
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        if (declaration.getClarificationRound() >= 3) {
            throw new ClarificationLimitExceededException(
                    "Maximum clarification rounds reached. You must approve or reject this declaration.");
        }

        transitionValidator.validateDeclarationTransition(
                declaration.getStatus().name(), DeclarationStatus.CLARIFICATION_REQUESTED.name());

        declaration.setStatus(DeclarationStatus.CLARIFICATION_REQUESTED);
        declaration.setClarificationRound(declaration.getClarificationRound() + 1);
        declarationRepository.save(declaration);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        notificationPublisher.publish(declaration.getSubmittedBy(), "CLARIFICATION_REQUESTED",
                declarationId, "ASSET_DECLARATION");
        auditService.logDataEvent(claims.userId(), claims.role(), "CLARIFICATION_REQUESTED",
                "AssetDeclaration", declarationId, "round=" + declaration.getClarificationRound());
        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "QUERY",
                "Clarification requested (round " + declaration.getClarificationRound() + "): " + request.getMessage());

        if (declaration.getClarificationRound() == 2) {
            userRepository.findAllByRole(UserRole.SUPER_ADMIN).forEach(sa ->
                    notificationPublisher.publish(sa.getId(), "CLARIFICATION_ESCALATION",
                            declarationId, "ASSET_DECLARATION"));
        }

        summaryService.refresh(declaration.getTempleId());
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
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse markUnderReview(Long declarationId, ScopeHelper.Claims claims) {
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                declaration.getStatus().name(), DeclarationStatus.UNDER_REVIEW.name());

        declaration.setStatus(DeclarationStatus.UNDER_REVIEW);
        declarationRepository.save(declaration);

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

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public WorkflowActionResponse flagPhysicalVerification(Long declarationId, DcClarifyRequest request,
                                                            ScopeHelper.Claims claims) {
        AssetDeclaration declaration = loadDeclarationWithLock(declarationId);
        Temple temple = loadTempleWithGeo(declaration.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        transitionValidator.validateDeclarationTransition(
                declaration.getStatus().name(), DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name());

        declaration.setStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED);
        declarationRepository.save(declaration);

        saveClarification(declarationId, request.getMessage(), request.getSectionName(),
                request.getFieldNames(), claims.userId(), ClarificationDirection.DC_TO_TEMPLE);

        notificationPublisher.publish(declaration.getSubmittedBy(), "PHYSICAL_VERIFICATION_REQUESTED",
                declarationId, "ASSET_DECLARATION");
        auditService.logDataEvent(claims.userId(), claims.role(), "PHYSICAL_VERIFICATION_REQUESTED",
                "AssetDeclaration", declarationId, "flagged=true");
        governanceAuditService.logAction(declarationId, "DECLARATION", claims.userId(), "FLAG",
                "Flagged for physical verification: " + request.getMessage());
        summaryService.refresh(declaration.getTempleId());

        log.info("Physical verification flagged for declaration [{}] by userId={}", declarationId, claims.userId());
        return WorkflowActionResponse.builder()
                .declarationId(declarationId)
                .newStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name())
                .message("Declaration flagged for physical verification.")
                .build();
    }

    // =========================================================================
    // PHYSICAL VERIFICATION — Declarations only, DC-only
    // =========================================================================

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void orderPhysicalVerification(Long declarationId, OrderPhysicalVerificationRequest request) {
        AssetDeclaration declaration = loadDeclaration(declarationId);
        jurisdictionGuard.assertSameDistrict(declaration.getDistrictId());

        // Can only order if declaration has been submitted
        if (declaration.getSubmissionStatus() == SubmissionStatus.DRAFT
                || declaration.getSubmissionStatus() == SubmissionStatus.REJECTED) {
            throw new IllegalStatusTransitionException(
                    "Cannot order physical verification for declaration [" + declarationId +
                    "] in status " + declaration.getSubmissionStatus() + ". Declaration must be SUBMITTED.");
        }

        PhysicalVerificationStatus previous = declaration.getPhysicalVerificationStatus();
        declaration.setPhysicalVerificationStatus(PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION);
        declaration.setPhysicalVerificationOrderedAt(LocalDateTime.now());
        declaration.setPhysicalVerificationOrderedBy(currentUserId());
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);
        declarationRepository.save(declaration);

        // Append-only history entry
        physicalVerificationHistoryRepository.save(PhysicalVerificationHistory.builder()
                .declarationId(declarationId)
                .dcUserId(currentUserId())
                .previousStatus(previous)
                .newStatus(PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION)
                .notes(request.getNotes())
                .build());

        governanceAuditService.logAction(declarationId, "DECLARATION", currentUserId(),
                "ORDER_PHYSICAL_VERIFICATION",
                "Physical verification ordered. Notes: " + request.getNotes());
        log.info("Declaration [{}] physical verification ORDERED by userId={}", declarationId, currentUserId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void updatePhysicalVerification(Long declarationId, UpdatePhysicalVerificationRequest request) {
        AssetDeclaration declaration = loadDeclaration(declarationId);
        jurisdictionGuard.assertSameDistrict(declaration.getDistrictId());

        PhysicalVerificationStatus current = declaration.getPhysicalVerificationStatus();
        PhysicalVerificationStatus newStatus = request.getNewStatus();

        // Only allowed from ORDERED state
        if (current != PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION) {
            throw new IllegalStatusTransitionException(
                    "Physical verification status can only be updated from ORDERED_FOR_PHYSICAL_VERIFICATION. " +
                    "Current status: " + current);
        }
        if (newStatus != PhysicalVerificationStatus.PHYSICALLY_VERIFIED
                && newStatus != PhysicalVerificationStatus.VERIFICATION_FAILED) {
            throw new IllegalStatusTransitionException(
                    "Physical verification can only be updated to PHYSICALLY_VERIFIED or VERIFICATION_FAILED. " +
                    "Requested: " + newStatus);
        }

        declaration.setPhysicalVerificationStatus(newStatus);
        declaration.setPhysicalVerificationCompletedAt(LocalDateTime.now());
        declaration.setGovernanceVersion(declaration.getGovernanceVersion() + 1);
        declarationRepository.save(declaration);

        physicalVerificationHistoryRepository.save(PhysicalVerificationHistory.builder()
                .declarationId(declarationId)
                .dcUserId(currentUserId())
                .previousStatus(current)
                .newStatus(newStatus)
                .notes(request.getNotes())
                .build());

        governanceAuditService.logAction(declarationId, "DECLARATION", currentUserId(),
                "UPDATE_PHYSICAL_VERIFICATION",
                "Physical verification updated: " + current + " → " + newStatus +
                ". Notes: " + request.getNotes());
        log.info("Declaration [{}] physical verification updated: {} → {} by userId={}",
                declarationId, current, newStatus, currentUserId());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC + " or " + RoleConstants.IS_DC_ROLE)
    public List<PhysicalVerificationHistoryResponse> getPhysicalVerificationHistory(Long declarationId) {
        // Jurisdiction check
        AssetDeclaration declaration = loadDeclaration(declarationId);
        jurisdictionGuard.assertSameDistrict(declaration.getDistrictId());

        return physicalVerificationHistoryRepository
                .findAllByDeclarationIdOrderByOccurredAtDesc(declarationId)
                .stream()
                .map(h -> PhysicalVerificationHistoryResponse.builder()
                        .id(h.getId())
                        .declarationId(h.getDeclarationId())
                        .dcUserId(h.getDcUserId())
                        .previousStatus(h.getPreviousStatus())
                        .newStatus(h.getNewStatus())
                        .notes(h.getNotes())
                        .occurredAt(h.getOccurredAt())
                        .build())
                .toList();
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Validates that a TA can submit: only DRAFT or SENT_BACK are valid starting states.
     * REJECTED records cannot be edited — TA must create a new one.
     */
    private void assertCanSubmit(SubmissionStatus current, String entityType, Long entityId) {
        if (current != SubmissionStatus.DRAFT && current != SubmissionStatus.SENT_BACK) {
            throw new IllegalStatusTransitionException(
                    "Cannot submit " + entityType + " [" + entityId + "]: current status is " + current +
                    ". Only DRAFT or SENT_BACK records can be submitted.");
        }
    }

    /**
     * Validates that DC can act: only SUBMITTED records can be approved/sent-back/rejected.
     */
    private void assertDcCanAct(SubmissionStatus current, String entityType, Long entityId) {
        if (current != SubmissionStatus.SUBMITTED) {
            throw new IllegalStatusTransitionException(
                    "Cannot perform DC action on " + entityType + " [" + entityId +
                    "]: current status is " + current + ". Only SUBMITTED records can be acted upon.");
        }
    }

    private void assertDistrictScopeForTrust(Trust trust) {
        Temple temple = templeRepository.findWithGeoById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
    }

    private Trust loadTrust(Long id) {
        return trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
    }

    private AssetDeclaration loadDeclaration(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", id));
    }

    private AssetDeclaration loadDeclarationWithLock(Long id) {
        return declarationRepository.findByIdWithLock(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", id));
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
        clarificationRepository.save(DeclarationClarification.builder()
                .declarationId(declarationId)
                .direction(direction)
                .message(message)
                .sectionName(sectionName)
                .fieldNamesJson(fieldNamesJson)
                .authorId(authorId)
                .build());
    }

    private void notifyDcOfSubmission(Long templeId, String moduleName, Long entityId) {
        notificationPublisher.publish(0L, moduleName + "_SUBMITTED", entityId, moduleName);
        log.debug("DC submission notification queued: module={} entityId={}", moduleName, entityId);
    }

    private void notifyTaOfDecision(Long templeId, String moduleName, Long entityId,
                                     String decision, String reason) {
        notificationPublisher.publish(0L, moduleName + "_" + decision, entityId, moduleName);
        log.debug("TA decision notification queued: module={} entityId={} decision={}", moduleName, entityId, decision);
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }
}
