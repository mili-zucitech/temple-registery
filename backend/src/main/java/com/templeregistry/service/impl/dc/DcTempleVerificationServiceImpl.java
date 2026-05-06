package com.templeregistry.service.impl.dc;

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
import com.templeregistry.service.temple.TempleProfileStagingService;
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
    private final TempleProfileStagingService stagingService;
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

        // Auto-approve any pending SUBMITTED staging — DC verification of the temple
        // implies acceptance of the currently-staged profile data. Without this, TA
        // would be permanently blocked from creating new drafts after DC uses the direct
        // verify path instead of the staging approval workflow.
        profileStagingRepository
                .findFirstByTempleIdAndStatus(templeId,
                        com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED)
                .ifPresent(staging -> {
                    try {
                        stagingService.approve(templeId, staging.getId());
                        log.info("Auto-approved SUBMITTED staging [{}] on temple verify: templeId=[{}]",
                                staging.getId(), templeId);
                    } catch (IllegalStateException e) {
                        // Staging may already have been resolved (race condition) — log and continue.
                        log.warn("Could not auto-approve staging [{}] during verify (already resolved?): {}",
                                staging.getId(), e.getMessage());
                    }
                });

        // Reload temple to pick up any field promotions from the staging approval above.
        temple = templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Temple not found with id: " + templeId, "TEMPLE_NOT_FOUND"));

        temple.setVerificationStatus(VerificationStatus.VERIFIED);
        temple.setDcRejectionReason(null);

        Temple saved = templeRepository.save(temple);
        summaryService.refresh(templeId);
        notificationHelper.notifyTempleApproved(templeId, claims.userId());

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
        summaryService.refresh(templeId);

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
        summaryService.refresh(templeId);

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
