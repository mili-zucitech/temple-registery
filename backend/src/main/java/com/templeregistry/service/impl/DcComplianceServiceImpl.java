package com.templeregistry.service.impl;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.DcComplianceService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * DC compliance actions for governed modules: Temple and Trust only.
 *
 * Staff (Employee) and Contractor modules have NO DC approval or verification workflow.
 * Any attempt to call verify/flag on Staff or Contractors is rejected at the controller layer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@PreAuthorize(RoleConstants.CAN_ACT_DC)
public class DcComplianceServiceImpl implements DcComplianceService {

    private final TempleRepository templeRepository;
    private final TrustRepository trustRepository;
    private final GovernanceAuditService governanceAuditService;
    private final JurisdictionGuard jurisdictionGuard;
    private final NotificationEventPublisher notificationPublisher;
    private final UserRepository userRepository;

    // ─── Temple ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(id);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        temple.setVerificationStatus(VerificationStatus.VERIFIED);
        templeRepository.save(temple);

        governanceAuditService.logAction(id, "TEMPLE", claims.userId(), "VERIFY", req.getNotes());
        notifyTa(temple.getId(), temple.getName(), "TEMPLE", "VERIFIED", null);
        log.info("Temple [{}] VERIFIED by userId={}", id, claims.userId());
    }

    @Override
    @Transactional
    public void flagTemple(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(id);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        temple.setVerificationStatus(VerificationStatus.FLAGGED);
        templeRepository.save(temple);

        governanceAuditService.logAction(id, "TEMPLE", claims.userId(), "FLAG", req.getReason());
        notifyTa(temple.getId(), temple.getName(), "TEMPLE", "FLAGGED", req.getReason());
        log.info("Temple [{}] FLAGGED by userId={}", id, claims.userId());
    }

    // ─── Trust ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyTrust(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
        try {
            Trust trust = trustRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("Trust", id));
            Temple temple = loadTempleWithGeo(trust.getTempleId());
            jurisdictionGuard.assertDistrictScope(temple, claims);

            trust.setVerifiedByDc(true);
            trust.setDcFlagReason(null);
            trustRepository.save(trust);

            governanceAuditService.logAction(id, "TRUST", claims.userId(), "VERIFY", req.getNotes());
            notifyTa(temple.getId(), temple.getName(), "TRUST", "VERIFIED", null);
            log.info("Trust [{}] VERIFIED by userId={}", id, claims.userId());
        } catch (Exception e) {
            log.error("VERIFY TRUST FAILED: trustId={}, error={}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void flagTrust(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
        Trust trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        Temple temple = loadTempleWithGeo(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        trust.setVerifiedByDc(false);
        trust.setDcFlagReason(req.getReason());
        trustRepository.save(trust);

        governanceAuditService.logAction(id, "TRUST", claims.userId(), "FLAG", req.getReason());
        notifyTa(temple.getId(), temple.getName(), "TRUST", "FLAGGED", req.getReason());
        log.info("Trust [{}] FLAGGED by userId={}", id, claims.userId());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    private void notifyTa(Long templeId, String templeName, String moduleName,
                           String action, String reason) {
        userRepository.findByTempleId(templeId).ifPresent(taUser -> {
            notificationPublisher.publish(taUser.getId(), moduleName + "_" + action, templeId, moduleName);
            log.debug("Notification queued for TA userId={} module={} action={}", taUser.getId(), moduleName, action);
        });
    }
}
