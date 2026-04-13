package com.templeregistry.service.impl;

import com.templeregistry.dto.request.dc.DcFlagRequest;
import com.templeregistry.dto.request.dc.DcVerifyRequest;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.DcComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;

@Service
@RequiredArgsConstructor
@PreAuthorize(RoleConstants.CAN_ACT_DC)
public class DcComplianceServiceImpl implements DcComplianceService {

        private final TempleRepository templeRepository;
        private final TrustRepository trustRepository;
        private final EmployeeRepository employeeRepository;
        private final ContractorRepository contractorRepository;
        private final GovernanceAuditService governanceAuditService;
        private final JurisdictionGuard jurisdictionGuard;

        @Override
        @Transactional
        public void verifyTemple(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
                Temple temple = templeRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Temple", id));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                temple.setVerificationStatus(VerificationStatus.VERIFIED);
                templeRepository.save(temple);

                governanceAuditService.logAction(id, "TEMPLE", claims.userId(), "VERIFY", req.getNotes());
        }

        @Override
        @Transactional
        public void flagTemple(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
                Temple temple = templeRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Temple", id));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                temple.setVerificationStatus(VerificationStatus.FLAGGED);
                templeRepository.save(temple);

                governanceAuditService.logAction(id, "TEMPLE", claims.userId(), "FLAG", req.getReason());
        }

        @Override
        @Transactional
        public void verifyTrust(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
                Trust trust = trustRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
                Temple temple = templeRepository.findById(trust.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                trust.setVerifiedByDc(true);
                trust.setDcFlagReason(null);
                trustRepository.save(trust);

                governanceAuditService.logAction(id, "TRUST", claims.userId(), "VERIFY", req.getNotes());
        }

        @Override
        @Transactional
        public void flagTrust(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
                Trust trust = trustRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
                Temple temple = templeRepository.findById(trust.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                trust.setVerifiedByDc(false);
                trust.setDcFlagReason(req.getReason());
                trustRepository.save(trust);

                governanceAuditService.logAction(id, "TRUST", claims.userId(), "FLAG", req.getReason());
        }

        @Override
        @Transactional
        public void verifyEmployee(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
                Employee employee = employeeRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Employee", id));
                Temple temple = templeRepository.findById(employee.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", employee.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                employee.setVerifiedByDc(true);
                employee.setDcFlagReason(null);
                employeeRepository.save(employee);

                governanceAuditService.logAction(id, "EMPLOYEE", claims.userId(), "VERIFY", req.getNotes());
        }

        @Override
        @Transactional
        public void flagEmployee(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
                Employee employee = employeeRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Employee", id));
                Temple temple = templeRepository.findById(employee.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", employee.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                employee.setVerifiedByDc(false);
                employee.setDcFlagReason(req.getReason());
                employeeRepository.save(employee);

                governanceAuditService.logAction(id, "EMPLOYEE", claims.userId(), "FLAG", req.getReason());
        }

        @Override
        @Transactional
        public void verifyContractor(Long id, DcVerifyRequest req, ScopeHelper.Claims claims) {
                Contractor contractor = contractorRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Contractor", id));
                Temple temple = templeRepository.findById(contractor.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", contractor.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                contractor.setVerifiedByDc(true);
                contractor.setDcFlagReason(null);
                contractorRepository.save(contractor);

                governanceAuditService.logAction(id, "CONTRACTOR", claims.userId(), "VERIFY", req.getNotes());
        }

        @Override
        @Transactional
        public void flagContractor(Long id, DcFlagRequest req, ScopeHelper.Claims claims) {
                Contractor contractor = contractorRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException("Contractor", id));
                Temple temple = templeRepository.findById(contractor.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", contractor.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                contractor.setVerifiedByDc(false);
                contractor.setDcFlagReason(req.getReason());
                contractorRepository.save(contractor);

                governanceAuditService.logAction(id, "CONTRACTOR", claims.userId(), "FLAG", req.getReason());
        }
}
