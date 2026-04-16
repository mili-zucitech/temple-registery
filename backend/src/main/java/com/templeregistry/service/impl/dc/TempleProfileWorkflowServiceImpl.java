package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.RejectProfileRequest;
import com.templeregistry.dto.response.dc.WorkflowActionResponse;
import com.templeregistry.entity.dc.ProfileStagingStatus;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.dc.TempleProfileHistory;
import com.templeregistry.entity.dc.TempleProfileStaging;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.dc.TempleProfileCurrentRepository;
import com.templeregistry.repository.dc.TempleProfileHistoryRepository;
import com.templeregistry.repository.dc.TempleProfileStagingRepository;
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
                    .version(staging.getVersion() - 1)
                    .phone(existing.getPhone())
                    .email(existing.getEmail())
                    .website(existing.getWebsite())
                    .contactPersonName(existing.getContactPersonName())
                    .contactPersonDesignation(existing.getContactPersonDesignation())
                    .photoFilePath(existing.getPhotoFilePath())
                    .bankName(existing.getBankName())
                    .bankIfsc(existing.getBankIfsc())
                    .bankAccountNumberEncrypted(existing.getBankAccountNumberEncrypted())
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

        TempleProfileCurrent newCurrent = TempleProfileCurrent.builder()
                .templeId(staging.getTempleId())
                .phone(staging.getPhone())
                .email(staging.getEmail())
                .website(staging.getWebsite())
                .contactPersonName(staging.getContactPersonName())
                .contactPersonDesignation(staging.getContactPersonDesignation())
                .photoFilePath(staging.getPhotoFilePath())
                .bankName(staging.getBankName())
                .bankIfsc(staging.getBankIfsc())
                .bankAccountNumberEncrypted(staging.getBankAccountNumberEncrypted())
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
        staging.setStatus(ProfileStagingStatus.APPROVED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(claims.userId());
        if (request.getRemarks() != null) {
            staging.setReviewComment(request.getRemarks());
        }
        stagingRepository.save(staging);

        notificationPublisher.publish(
                staging.getSubmittedBy(), "PROFILE_APPROVED", staging.getTempleId(), "TEMPLE_PROFILE");

        auditService.logDataEvent(claims.userId(), claims.role(), "PROFILE_APPROVED",
                "TempleProfileStaging", stagingId, "templeId=" + staging.getTempleId());

        summaryService.refresh(staging.getTempleId());

        log.info("Profile staging [{}] APPROVED by userId={} for templeId={}",
                stagingId, claims.userId(), staging.getTempleId());

        return WorkflowActionResponse.builder()
                .declarationId(stagingId)
                .newStatus(ProfileStagingStatus.APPROVED.name())
                .acknowledgementNumber(null)
                .message("Temple profile approved and published.")
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

        staging.setStatus(ProfileStagingStatus.REJECTED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(claims.userId());
        staging.setReviewComment(request.getRemarks());
        stagingRepository.save(staging);

        notificationPublisher.publish(
                staging.getSubmittedBy(), "PROFILE_REJECTED", staging.getTempleId(), "TEMPLE_PROFILE");

        auditService.logDataEvent(claims.userId(), claims.role(), "PROFILE_REJECTED",
                "TempleProfileStaging", stagingId, "templeId=" + staging.getTempleId());

        summaryService.refresh(staging.getTempleId());

        log.info("Profile staging [{}] REJECTED by userId={}", stagingId, claims.userId());

        return WorkflowActionResponse.builder()
                .declarationId(stagingId)
                .newStatus(ProfileStagingStatus.REJECTED.name())
                .acknowledgementNumber(null)
                .message("Temple profile rejected.")
                .build();
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private TempleProfileStaging loadStaging(Long stagingId) {
        return stagingRepository.findById(stagingId)
                .orElseThrow(() -> new EntityNotFoundException("TempleProfileStaging", stagingId));
    }

    private void assertPendingReview(TempleProfileStaging staging) {
        if (staging.getStatus() != ProfileStagingStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                    "Profile staging [" + staging.getId() + "] is not in PENDING_REVIEW status. "
                            + "Current status: " + staging.getStatus());
        }
    }

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }
}
