package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.dc.TempleProfileHistory;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.dc.TempleProfileCurrentRepository;
import com.templeregistry.repository.dc.TempleProfileHistoryRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.dc.TempleProfileWorkflowService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
 *  8. Calls TempleSearchSummaryService.refresh() in same transaction
 *
 * On REJECT:
 *  1. Validates staging status is PENDING_REVIEW
 *  2. Asserts district scope
 *  3. Sets staging status = REJECTED, stores reviewComment
 *  4. Publishes in-transaction NotificationEvent
 *  5. Fires async audit log
 *  6. Calls TempleSearchSummaryService.refresh() in same transaction
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
    private final NotificationEventPublisher notificationPublisher;
    private final TempleSearchSummaryService summaryService;
    private final AuditService auditService;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public WorkflowActionResponse approveProfile(Long stagingId, ApproveProfileRequest request,
                                                  ScopeHelper.Claims claims) {
        TempleProfileStaging staging = loadStaging(stagingId);
        assertPendingReview(staging);

        Temple temple = loadTempleWithGeo(staging.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Archive existing current → history
        currentRepository.findByTempleId(staging.getTempleId()).ifPresent(existing -> {
            TempleProfileHistory history = TempleProfileHistory.builder()
                    .templeId(existing.getTempleId())
                    .version(staging.getVersionNumber() - 1)
                    .contactPersonName(existing.getContactPersonName())
                    .contactPersonDesignation(existing.getContactPersonDesignation())
                    .photoFilePath(existing.getPhotoFilePath())
                    .bankAccountNumberEncrypted(existing.getBankAccountNumberEncrypted())
                    .languagesOfWorship(existing.getLanguagesOfWorship())
                    .linkedInstitutions(existing.getLinkedInstitutions())
                    .annualFestivals(existing.getAnnualFestivals())
                    .landmark(existing.getLandmark())
                    .historicalSignificance(existing.getHistoricalSignificance())
                    .publishedAt(existing.getPublishedAt())
                    .build();
            historyRepository.save(history);
            currentRepository.delete(existing);
        });

        // Promote staging content to current
        TempleProfileCurrent newCurrent = TempleProfileCurrent.builder()
                .templeId(staging.getTempleId())
                .contactPersonName(staging.getContactPersonName())
                .contactPersonDesignation(staging.getContactPersonDesignation())
                .photoFilePath(staging.getPhotoFilePath())
                .bankAccountNumberEncrypted(staging.getBankAccountNumberEncrypted())
                .languagesOfWorship(staging.getLanguagesOfWorship())
                .linkedInstitutions(staging.getLinkedInstitutions())
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

        // Mark previous APPROVED records for same temple as SUPERSEDED
        stagingRepository.findFirstByTempleIdAndStatus(staging.getTempleId(), TempleProfileStagingStatus.APPROVED)
                .ifPresent(prev -> {
                    if (!prev.getId().equals(staging.getId())) {
                        prev.setStatus(TempleProfileStagingStatus.SUPERSEDED);
                        stagingRepository.save(prev);
                    }
                });

        notificationPublisher.publish(staging.getSubmittedBy(), "PROFILE_APPROVED", staging.getTempleId(), "TEMPLE_PROFILE");
        auditService.logDataEvent(claims.userId(), claims.role(), "APPROVE", "TEMPLE_PROFILE", staging.getTempleId(),
                "Approved version " + staging.getVersionNumber());
        summaryService.refresh(staging.getTempleId());

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

        Temple temple = loadTempleWithGeo(staging.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        staging.setStatus(TempleProfileStagingStatus.REJECTED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(claims.userId());
        staging.setReviewComment(request.getReason());
        stagingRepository.save(staging);

        notificationPublisher.publish(staging.getSubmittedBy(), "PROFILE_REJECTED", staging.getTempleId(), "TEMPLE_PROFILE");
        auditService.logDataEvent(claims.userId(), claims.role(), "REJECT", "TEMPLE_PROFILE", staging.getTempleId(),
                "Rejected version " + staging.getVersionNumber() + ": " + request.getReason());

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
}
