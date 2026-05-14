package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.ApproveProfileRequest;
import com.templeregistry.dto.request.dc.FlagTempleProfileRequest;
import com.templeregistry.dto.request.dc.UnflagTempleProfileRequest;
import com.templeregistry.dto.request.dc.VerifyTempleProfileRequest;
import com.templeregistry.dto.response.dc.TempleVerificationResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleVerificationService;
import com.templeregistry.service.dc.TempleProfileWorkflowService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of DC temple verification workflow.
 * Handles verification, flagging, and unflagging of temple profiles by District Collector.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleVerificationServiceImpl implements DcTempleVerificationService {

    private final TempleRepository templeRepository;
    private final TempleProfileStagingRepository profileStagingRepository;
    private final TempleProfileWorkflowService workflowService;
    private final JurisdictionGuard jurisdictionGuard;
    private final TempleSearchSummaryService summaryService;
    private final com.templeregistry.service.notification.NotificationHelper notificationHelper;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TempleVerificationResponse verifyTempleProfile(Long templeId, VerifyTempleProfileRequest request,
                                                          ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Auto-approve any pending staging (SUBMITTED / UNDER_REVIEW / RESUBMITTED) via the full
        // workflow service so that temple_profile_current is written, audit is logged, and search
        // summary is refreshed.  approveProfile also sets verificationStatus = VERIFIED and sends
        // the approved notification.
        //
        // IMPORTANT: no try-catch here.  approveProfile() is @Transactional(REQUIRED) and shares
        // this outer transaction.  If we catch its exception, the transaction is already marked
        // rollback-only by Spring's interceptor, causing UnexpectedRollbackException at commit.
        // Letting the exception propagate produces a clean failure instead.
        boolean stagingApproved = false;
        var pendingStaging = profileStagingRepository
                .findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                        templeId,
                        java.util.List.of(
                                com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED,
                                com.templeregistry.entity.workflow.WorkflowStatus.UNDER_REVIEW,
                                com.templeregistry.entity.workflow.WorkflowStatus.RESUBMITTED));
        if (pendingStaging.isPresent()) {
            workflowService.approveProfile(
                    pendingStaging.get().getId(), new ApproveProfileRequest(), claims);
            stagingApproved = true;
            log.info("Auto-approved staging [{}] on temple verify: templeId=[{}]",
                    pendingStaging.get().getId(), templeId);
        }

        // Reload temple to pick up field promotions from approveProfile (if called above).
        temple = templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Temple not found with id: " + templeId, "TEMPLE_NOT_FOUND"));

        // Re-assert VERIFIED regardless — the direct verify path is an explicit DC override.
        temple.setVerificationStatus(VerificationStatus.VERIFIED);
        temple.setDcRejectionReason(null);
        Temple saved = templeRepository.save(temple);
        summaryService.scheduleRefresh(templeId);

        // Only notify if no staging was approved — approveProfile already sends the notification.
        if (!stagingApproved) {
            notificationHelper.notifyTempleApproved(templeId, claims.userId());
        }

        log.info("Temple profile verified by DC: templeId=[{}] dcUserId=[{}]", templeId, claims.userId());

        return buildResponse(saved, "Temple profile verified successfully.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TempleVerificationResponse flagTempleProfile(Long templeId, FlagTempleProfileRequest request,
                                                        ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Flag the temple - set status to FLAGGED
        temple.setVerificationStatus(VerificationStatus.FLAGGED);
        temple.setDcRejectionReason(request.getReason());

        Temple saved = templeRepository.save(temple);
        summaryService.scheduleRefresh(templeId);

        // Send notification to all TAs for this temple
        notificationHelper.notifyTempleFlagged(templeId, claims.userId(), request.getReason());

        log.info("Temple profile flagged by DC: templeId=[{}] dcUserId=[{}] reason=[{}]",
                templeId, claims.userId(), request.getReason());

        return buildResponse(saved, "Temple profile flagged successfully.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TempleVerificationResponse unflagTempleProfile(Long templeId, UnflagTempleProfileRequest request,
                                                          ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        if (temple.getVerificationStatus() != VerificationStatus.FLAGGED) {
            throw new IllegalStateException("Temple profile is not currently flagged.");
        }

        // Remove flag - set status back to UNVERIFIED
        temple.setVerificationStatus(VerificationStatus.UNVERIFIED);
        temple.setDcRejectionReason(null);

        Temple saved = templeRepository.save(temple);
        summaryService.scheduleRefresh(templeId);

        // Send notification to all TAs for this temple
        notificationHelper.notifyTempleUnflagged(templeId, claims.userId());

        log.info("Temple profile unflagged by DC: templeId=[{}] dcUserId=[{}]", templeId, claims.userId());

        return buildResponse(saved, "Temple profile flag removed successfully.");
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    public TempleVerificationResponse getVerificationStatus(Long templeId, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        return buildResponse(temple, "Verification status retrieved successfully.");
    }

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Temple not found with id: " + templeId,
                        "TEMPLE_NOT_FOUND"));
    }

    private TempleVerificationResponse buildResponse(Temple temple, String message) {
        return TempleVerificationResponse.builder()
                .templeId(temple.getId())
                .registrationNumber(temple.getRegistrationNumber())
                .templeName(temple.getName())
                .verificationStatus(temple.getVerificationStatus() != null ? temple.getVerificationStatus().name() : null)
                .dcRejectionReason(temple.getDcRejectionReason())
                .message(message)
                .build();
    }
}
