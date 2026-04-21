package com.templeregistry.service.impl;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
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
 * Handles per-module DC compliance actions (verify / flag) for all governance entities.
 *
 * Each action:
 *  1. Loads the entity and asserts district scope
 *  2. Updates the entity's isVerifiedByDc / dcFlagReason fields
 *  3. Logs a governance audit entry
 *  4. Sends an in-app notification to the Temple Authority with module name + temple name
 */
@Service
@RequiredArgsConstructor
@Slf4j
@PreAuthorize(RoleConstants.CAN_ACT_DC)
public class DcComplianceServiceImpl implements DcComplianceService {

    private final TempleRepository templeRepository;
    private final TrustRepository trustRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractorRepository contractorRepository;
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

    // ─── Employee ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyEmployee(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee", id));
        Temple temple = loadTempleWithGeo(employee.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        employee.setVerifiedByDc(true);
        employee.setDcFlagReason(null);
        employeeRepository.save(employee);

        governanceAuditService.logAction(id, "EMPLOYEE", claims.userId(), "VERIFY", req.getNotes());
        notifyTa(temple.getId(), temple.getName(), "STAFF", "VERIFIED", null);
        log.info("Employee [{}] VERIFIED by userId={}", id, claims.userId());
    }

    @Override
    @Transactional
    public void flagEmployee(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Employee", id));
        Temple temple = loadTempleWithGeo(employee.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        employee.setVerifiedByDc(false);
        employee.setDcFlagReason(req.getReason());
        employeeRepository.save(employee);

        governanceAuditService.logAction(id, "EMPLOYEE", claims.userId(), "FLAG", req.getReason());
        notifyTa(temple.getId(), temple.getName(), "STAFF", "FLAGGED", req.getReason());
        log.info("Employee [{}] FLAGGED by userId={}", id, claims.userId());
    }

    // ─── Staff Module (bulk) ──────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyStaffModule(Long templeId, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        java.util.List<com.templeregistry.entity.employee.Employee> employees =
                employeeRepository.findAllByTempleId(templeId);
        employees.forEach(e -> {
            e.setVerifiedByDc(true);
            e.setDcFlagReason(null);
        });
        employeeRepository.saveAll(employees);

        governanceAuditService.logAction(templeId, "STAFF_MODULE", claims.userId(), "VERIFY",
                "Verified " + employees.size() + " employee(s). " + req.getNotes());
        notifyTa(templeId, temple.getName(), "STAFF", "VERIFIED", null);
        log.info("Staff module for temple [{}] VERIFIED ({} employees) by userId={}",
                templeId, employees.size(), claims.userId());
    }

    @Override
    @Transactional
    public void flagStaffModule(Long templeId, DcFlagRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        java.util.List<com.templeregistry.entity.employee.Employee> employees =
                employeeRepository.findAllByTempleId(templeId);
        employees.forEach(e -> {
            e.setVerifiedByDc(false);
            e.setDcFlagReason(req.getReason());
        });
        employeeRepository.saveAll(employees);

        governanceAuditService.logAction(templeId, "STAFF_MODULE", claims.userId(), "FLAG", req.getReason());
        notifyTa(templeId, temple.getName(), "STAFF", "FLAGGED", req.getReason());
        log.info("Staff module for temple [{}] FLAGGED by userId={}", templeId, claims.userId());
    }

    // ─── Contractor ───────────────────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyContractor(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contractor", id));
        Temple temple = loadTempleWithGeo(contractor.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        contractor.setVerifiedByDc(true);
        contractor.setDcFlagReason(null);
        contractorRepository.save(contractor);

        governanceAuditService.logAction(id, "CONTRACTOR", claims.userId(), "VERIFY", req.getNotes());
        notifyTa(temple.getId(), temple.getName(), "CONTRACTORS", "VERIFIED", null);
        log.info("Contractor [{}] VERIFIED by userId={}", id, claims.userId());
    }

    @Override
    @Transactional
    public void flagContractor(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
        Contractor contractor = contractorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contractor", id));
        Temple temple = loadTempleWithGeo(contractor.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, claims);

        contractor.setVerifiedByDc(false);
        contractor.setDcFlagReason(req.getReason());
        contractorRepository.save(contractor);

        governanceAuditService.logAction(id, "CONTRACTOR", claims.userId(), "FLAG", req.getReason());
        notifyTa(temple.getId(), temple.getName(), "CONTRACTORS", "FLAGGED", req.getReason());
        log.info("Contractor [{}] FLAGGED by userId={}", id, claims.userId());
    }

    // ─── Contractors Module (bulk) ────────────────────────────────────────────

    @Override
    @Transactional
    public void verifyContractorsModule(Long templeId, DcVerifyRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        java.util.List<com.templeregistry.entity.contractor.Contractor> contractors =
                contractorRepository.findAllByTempleId(templeId);
        contractors.forEach(c -> {
            c.setVerifiedByDc(true);
            c.setDcFlagReason(null);
        });
        contractorRepository.saveAll(contractors);

        governanceAuditService.logAction(templeId, "CONTRACTORS_MODULE", claims.userId(), "VERIFY",
                "Verified " + contractors.size() + " contractor(s). " + req.getNotes());
        notifyTa(templeId, temple.getName(), "CONTRACTORS", "VERIFIED", null);
        log.info("Contractors module for temple [{}] VERIFIED ({} contractors) by userId={}",
                templeId, contractors.size(), claims.userId());
    }

    @Override
    @Transactional
    public void flagContractorsModule(Long templeId, DcFlagRequest req, ScopeHelper.Claims claims) {
        Temple temple = loadTempleWithGeo(templeId);
        jurisdictionGuard.assertDistrictScope(temple, claims);

        java.util.List<com.templeregistry.entity.contractor.Contractor> contractors =
                contractorRepository.findAllByTempleId(templeId);
        contractors.forEach(c -> {
            c.setVerifiedByDc(false);
            c.setDcFlagReason(req.getReason());
        });
        contractorRepository.saveAll(contractors);

        governanceAuditService.logAction(templeId, "CONTRACTORS_MODULE", claims.userId(), "FLAG", req.getReason());
        notifyTa(templeId, temple.getName(), "CONTRACTORS", "FLAGGED", req.getReason());
        log.info("Contractors module for temple [{}] FLAGGED by userId={}", templeId, claims.userId());
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Temple loadTempleWithGeo(Long templeId) {
        return templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    /**
     * Sends an in-app notification to the Temple Authority user linked to the given temple.
     * Notification includes the module name and temple name so the TA knows exactly what changed.
     * Silently skips if no TA user is found (e.g. temple not yet linked to a user account).
     */
    private void notifyTa(Long templeId, String templeName, String moduleName,
                           String action, String reason) {
        userRepository.findByTempleId(templeId).ifPresent(taUser -> {
            String title = String.format("%s module %s — %s", moduleName, action, templeName);
            String body = "VERIFIED".equals(action)
                    ? String.format("The %s module for %s has been verified by the District Collector.", moduleName, templeName)
                    : String.format("The %s module for %s has been flagged. Reason: %s", moduleName, templeName, reason);
            notificationPublisher.publish(taUser.getId(), moduleName + "_" + action, templeId, moduleName);
            log.debug("Notification queued for TA userId={} module={} action={}", taUser.getId(), moduleName, action);
        });
    }
}
