package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.dc.TempleProfileHistory;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.dc.TempleProfileCurrentRepository;
import com.templeregistry.repository.dc.TempleProfileHistoryRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.TempleProfileWorkflowService;
import com.templeregistry.service.notification.NotificationHelper;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.workflow.ActionContextResolver;
import com.templeregistry.service.workflow.WorkflowActionRequest;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.util.StatusTransitionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Executes DC profile workflow actions on temple_profile_staging.
 *
 * On APPROVE:
 *  1. Validates staging status is PENDING_REVIEW
 *  2. Asserts district scope
 *  3. Archives existing temple_profile_current → temple_profile_history
 *  4. Writes new temple_profile_current row (UPSERT: delete + save)
 *  5. Sets staging status = APPROVED
 *  6. Publishes in-transaction NotificationEvent
 *  7. Fires async audit log
 *  8. Logs governance action history
 *  9. Calls TempleSearchsummaryService.scheduleRefresh() in same transaction
 *
 * On REJECT:
 *  1. Validates staging status is PENDING_REVIEW
 *  2. Asserts district scope
 *  3. Sets staging status = REJECTED, stores reviewComment
 *  4. Publishes in-transaction NotificationEvent
 *  5. Fires async audit log
 *  6. Logs governance action history
 *  7. Calls TempleSearchsummaryService.scheduleRefresh() in same transaction
 *
 * dc_e2e Section 4.4, 2.6, 2.8.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TempleProfileWorkflowServiceImpl implements TempleProfileWorkflowService {

    private final TempleProfileStagingRepository stagingRepository;
    private final TempleProfileCurrentRepository currentRepository;
    private final TempleProfileHistoryRepository historyRepository;
    private final TempleRepository templeRepository;
    private final JurisdictionGuard jurisdictionGuard;
    private final NotificationHelper notificationHelper;
    private final TempleSearchSummaryService summaryService;
    private final AuditService auditService;
    private final GovernanceAuditService governanceAuditService;
    private final StatusTransitionValidator transitionValidator;
    private final WorkflowEngine workflowEngine;
    private final ActionContextResolver actionContextResolver;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse approveProfile(Long stagingId, ApproveProfileRequest request,
                                                  ScopeHelper.Claims claims) {
        TempleProfileStaging staging = loadStaging(stagingId);
        assertPendingReview(staging);

        transitionValidator.validateProfileStagingTransition(staging.getStatus().name(), TempleProfileStagingStatus.APPROVED.name());

        Temple temple = loadTempleWithGeo(staging.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Archive existing current → history
        currentRepository.findByTempleId(staging.getTempleId()).ifPresent(existing -> {
            TempleProfileHistory history = TempleProfileHistory.builder()
                    .templeId(existing.getTempleId())
                    .version(staging.getVersionNumber() - 1)
                    .phone(existing.getPhone())
                    .email(existing.getEmail())
                    .website(existing.getWebsite())
                    .contactPersonName(existing.getContactPersonName())
                    .contactPersonDesignation(existing.getContactPersonDesignation())
                    .photoFilePath(existing.getPhotoFilePath())
                    .bankName(existing.getBankName())
                    .bankAccountNumberEncrypted(existing.getBankAccountNumberEncrypted())
                    .bankIfsc(existing.getBankIfsc())
                    .languagesOfWorship(existing.getLanguagesOfWorship())
                    .linkedInstitutions(existing.getLinkedInstitutions())
                    .description(existing.getDescription())
                    .annualFestivals(existing.getAnnualFestivals())
                    .landmark(existing.getLandmark())
                    .historicalSignificance(existing.getHistoricalSignificance())
                    .publishedAt(existing.getPublishedAt())
                    .build();
            historyRepository.save(history);
            currentRepository.delete(existing);
        });

        // Mark previous APPROVED records for same temple as SUPERSEDED
        // IMPORTANT: this must run BEFORE setting staging.status=APPROVED and saving,
        // otherwise findFirstByTempleIdAndStatus(APPROVED) finds the current record instead.
        stagingRepository.findFirstByTempleIdAndStatus(staging.getTempleId(), TempleProfileStagingStatus.APPROVED)
                .ifPresent(prev -> {
                    if (!prev.getId().equals(staging.getId())) {
                        transitionValidator.validateProfileStagingTransition(prev.getStatus().name(), TempleProfileStagingStatus.SUPERSEDED.name());
                        prev.setStatus(TempleProfileStagingStatus.SUPERSEDED);
                        stagingRepository.save(prev);
                    }
                });

        // Promote staging content to current
        TempleProfileCurrent newCurrent = TempleProfileCurrent.builder()
                .templeId(staging.getTempleId())
                .phone(staging.getPhone())
                .email(staging.getEmail())
                .website(staging.getWebsite())
                .contactPersonName(staging.getContactPersonName())
                .contactPersonDesignation(staging.getContactPersonDesignation())
                .photoFilePath(staging.getPhotoFilePath())
                .bankName(staging.getBankName())
                .bankAccountNumberEncrypted(staging.getBankAccountNumberEncrypted())
                .bankIfsc(staging.getBankIfsc())
                .languagesOfWorship(staging.getLanguagesOfWorship())
                .linkedInstitutions(staging.getLinkedInstitutions())
                .description(staging.getDescription())
                .annualFestivals(staging.getAnnualFestivals())
                .landmark(staging.getLandmark())
                .historicalSignificance(staging.getHistoricalSignificance())
                .publishedAt(LocalDateTime.now())
                .publishedBy(claims.userId())
                .build();
        currentRepository.save(newCurrent);

        // Update staging status
        staging.setStatus(TempleProfileStagingStatus.APPROVED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(claims.userId());
        stagingRepository.save(staging);

        // Promote approved profile fields to the canonical temples table (mirrors Path A behaviour)
        promoteToTemple(temple, staging);
        templeRepository.save(temple);

        // Advance WorkflowInstance to APPROVED so canonical state is consistent with entity column
        WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, staging.getId());
        workflowEngine.execute(instance.getId(), WorkflowActionRequest.builder()
                .action(WorkflowAction.APPROVE)
                .expectedVersion(instance.getLockVersion())
                .idempotencyKey(UUID.randomUUID().toString())
                .build(), actionContextResolver.resolve(claims));

        notificationHelper.notifyTempleApproved(staging.getTempleId(), claims.userId());
        auditService.logDataEvent(claims.userId(), claims.role(), "APPROVE", "TEMPLE_PROFILE", staging.getTempleId(),
                "Approved version " + staging.getVersionNumber());
        
        governanceAuditService.logAction(staging.getTempleId(), "TEMPLE_PROFILE", claims.userId(), "APPROVE", 
                "Approved version " + staging.getVersionNumber() + ". Remarks: " + request.getRemarks());

        summaryService.scheduleRefresh(staging.getTempleId());

        return WorkflowActionResponse.builder()
                .declarationId(staging.getId())
                .newStatus(TempleProfileStagingStatus.APPROVED.name())
                .message("Temple profile version " + staging.getVersionNumber() + " approved and published.")
                .build();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse rejectProfile(Long stagingId, RejectProfileRequest request,
                                                   ScopeHelper.Claims claims) {
        TempleProfileStaging staging = loadStaging(stagingId);
        assertPendingReview(staging);

        transitionValidator.validateProfileStagingTransition(staging.getStatus().name(), TempleProfileStagingStatus.REJECTED.name());

        Temple temple = loadTempleWithGeo(staging.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        staging.setStatus(TempleProfileStagingStatus.REJECTED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(claims.userId());
        staging.setReviewComment(request.getReason());
        stagingRepository.save(staging);

        // Advance WorkflowInstance to REJECTED so canonical state matches entity column
        WorkflowInstance rejInstance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, staging.getId());
        workflowEngine.execute(rejInstance.getId(), WorkflowActionRequest.builder()
                .action(WorkflowAction.REJECT)
                .expectedVersion(rejInstance.getLockVersion())
                .idempotencyKey(UUID.randomUUID().toString())
                .build(), actionContextResolver.resolve(claims));

        notificationHelper.notifyTempleRejected(staging.getTempleId(), claims.userId(), request.getReason());
        auditService.logDataEvent(claims.userId(), claims.role(), "REJECT", "TEMPLE_PROFILE", staging.getTempleId(),
                "Rejected version " + staging.getVersionNumber() + ": " + request.getReason());
        
        governanceAuditService.logAction(staging.getTempleId(), "TEMPLE_PROFILE", claims.userId(), "REJECT", 
                "Rejected version " + staging.getVersionNumber() + ". Remarks: " + request.getReason());

        summaryService.scheduleRefresh(staging.getTempleId());

        return WorkflowActionResponse.builder()
                .declarationId(staging.getId())
                .newStatus(TempleProfileStagingStatus.REJECTED.name())
                .message("Temple profile version " + staging.getVersionNumber() + " rejected.")
                .build();
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private TempleProfileStaging loadStaging(Long id) {
        return stagingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("TempleProfileStaging", id));
    }

    private void assertPendingReview(TempleProfileStaging staging) {
        if (staging.getStatus() != TempleProfileStagingStatus.PENDING_REVIEW) {
            throw new IllegalStateException("Staging record is not in PENDING_REVIEW status.");
        }
    }

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    /** Copies approved staging fields into the canonical temples table (mirrors TempleProfileStagingServiceImpl). */
    private void promoteToTemple(Temple temple, TempleProfileStaging staging) {
        if (staging.getContactPersonName() != null)
            temple.setContactName(staging.getContactPersonName());
        if (staging.getContactPersonDesignation() != null)
            temple.setContactDesignation(staging.getContactPersonDesignation());
        if (staging.getLanguagesOfWorship() != null)
            temple.setLanguagesOfWorship(staging.getLanguagesOfWorship());
        if (staging.getPhotoFilePath() != null)
            temple.setPhotoUrl(staging.getPhotoFilePath());
        if (staging.getPhone() != null)
            temple.setContactMobile(staging.getPhone());
        if (staging.getEmail() != null)
            temple.setContactEmail(staging.getEmail());
        if (staging.getWebsite() != null)
            temple.setWebsite(staging.getWebsite());
        if (staging.getDescription() != null)
            temple.setHistory(staging.getDescription());
        else if (staging.getHistoricalSignificance() != null)
            temple.setHistory(staging.getHistoricalSignificance());
        if (staging.getAnnualFestivals() != null)
            temple.setAnnualFestivals(staging.getAnnualFestivals());
        if (staging.getLandmark() != null)
            temple.setLandmark(staging.getLandmark());
        if (staging.getHistoricalSignificance() != null)
            temple.setHistoricalSignificance(staging.getHistoricalSignificance());
        if (staging.getBankName() != null)
            temple.setBankName(staging.getBankName());
        if (staging.getBankIfsc() != null)
            temple.setBankIfsc(staging.getBankIfsc());
        if (staging.getLinkedInstitutions() != null)
            temple.setLinkedInstitutions(staging.getLinkedInstitutions());
    }
}
