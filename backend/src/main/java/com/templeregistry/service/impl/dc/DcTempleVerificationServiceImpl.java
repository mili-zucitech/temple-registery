package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.FlagTempleProfileRequest;
import com.templeregistry.dto.request.dc.UnflagTempleProfileRequest;
import com.templeregistry.dto.request.dc.VerifyTempleProfileRequest;
import com.templeregistry.dto.response.dc.TempleVerificationResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleVerificationService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implementation of DC temple verification workflow.
 * Handles verification, flagging, and unflagging of temple profiles by District Collector.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleVerificationServiceImpl implements DcTempleVerificationService {

    private final TempleRepository templeRepository;
    private final JurisdictionGuard jurisdictionGuard;
    private final NotificationEventPublisher notificationPublisher;
    private final TempleSearchSummaryService summaryService;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TempleVerificationResponse verifyTempleProfile(Long templeId, VerifyTempleProfileRequest request,
                                                          ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Verify the temple
        temple.setVerifiedByDc(true);
        temple.setVerifiedByDcAt(LocalDateTime.now());
        temple.setVerifiedByDcUserId(claims.userId());

        // Remove any existing flag when verifying
        if (temple.isFlaggedByDc()) {
            temple.setFlaggedByDc(false);
            temple.setFlaggedByDcAt(null);
            temple.setFlaggedByDcUserId(null);
            temple.setDcRejectionReason(null);
            log.info("Removed existing flag while verifying temple: templeId=[{}]", templeId);
        }

        Temple saved = templeRepository.save(temple);
        summaryService.refresh(templeId);

        // Publish notification to Temple Authority
        notificationPublisher.publishTempleVerified(
                templeId,
                temple.getName(),
                claims.userId(),
                request.getRemarks()
        );

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

        // Flag the temple
        temple.setFlaggedByDc(true);
        temple.setFlaggedByDcAt(LocalDateTime.now());
        temple.setFlaggedByDcUserId(claims.userId());
        temple.setDcRejectionReason(request.getReason());

        // Remove verification when flagging
        if (temple.isVerifiedByDc()) {
            temple.setVerifiedByDc(false);
            temple.setVerifiedByDcAt(null);
            temple.setVerifiedByDcUserId(null);
            log.info("Removed verification while flagging temple: templeId=[{}]", templeId);
        }

        Temple saved = templeRepository.save(temple);
        summaryService.refresh(templeId);

        // Publish notification to Temple Authority
        notificationPublisher.publishTempleFlagged(
                templeId,
                temple.getName(),
                claims.userId(),
                request.getReason()
        );

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

        if (!temple.isFlaggedByDc()) {
            throw new IllegalStateException("Temple profile is not currently flagged.");
        }

        // Remove flag
        temple.setFlaggedByDc(false);
        temple.setFlaggedByDcAt(null);
        temple.setFlaggedByDcUserId(null);
        temple.setDcRejectionReason(null);

        Temple saved = templeRepository.save(temple);
        summaryService.refresh(templeId);

        // Publish notification to Temple Authority
        notificationPublisher.publishTempleUnflagged(
                templeId,
                temple.getName(),
                claims.userId(),
                request.getRemarks()
        );

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
                .isVerifiedByDc(temple.isVerifiedByDc())
                .verifiedByDcAt(temple.getVerifiedByDcAt())
                .verifiedByDcUserId(temple.getVerifiedByDcUserId())
                .isFlaggedByDc(temple.isFlaggedByDc())
                .flaggedByDcAt(temple.getFlaggedByDcAt())
                .flaggedByDcUserId(temple.getFlaggedByDcUserId())
                .dcRejectionReason(temple.getDcRejectionReason())
                .message(message)
                .build();
    }
}
