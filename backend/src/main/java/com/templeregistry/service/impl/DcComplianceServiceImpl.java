package com.templeregistry.service.impl;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.DcComplianceService;
import com.templeregistry.service.notification.NotificationHelper;
import com.templeregistry.service.workflow.WorkflowEngineAdaptor;
import com.templeregistry.entity.workflow.WorkflowEntityType;
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
    private final NotificationHelper notificationHelper;
    private final WorkflowEngineAdaptor workflowEngineAdaptor;

    // ─── Temple ───────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(id);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        temple.setVerificationStatus(VerificationStatus.VERIFIED);
        templeRepository.save(temple);

        governanceAuditService.logAction(id, "TEMPLE", claims.userId(), "VERIFY", req.getNotes());
        notificationHelper.notifyTempleApproved(id, claims.userId());
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
        notificationHelper.notifyTempleFlagged(id, claims.userId(), req.getReason());
        log.info("Temple [{}] FLAGGED by userId={}", id, claims.userId());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }
}
