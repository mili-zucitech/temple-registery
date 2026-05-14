package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.response.auth.UserProfileResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.auth.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final TempleProfileStagingRepository stagingRepository;
    private final TempleRepository templeRepository;
    private final TrustRepository trustRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractorRepository contractorRepository;
    private final DeclarationRepository declarationRepository;
    private final WorkflowEngine workflowEngine;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public UserProfileResponse getCurrentUserProfile() {
        ScopeHelper.Claims claims = currentClaims();
        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new EntityNotFoundException("User", claims.userId()));

        UserProfileResponse.TempleCompletionChecklist checklist = null;
        if (user.getRole() == UserRole.TEMPLE_AUTHORITY && user.getTempleId() != null) {
            checklist = buildChecklist(user.getTempleId());
        }

        return UserProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .mobile(user.getMobile())
                .role(user.getRole())
                .active(user.isActive())
                .districtId(user.getDistrictId())
                .templeId(user.getTempleId())
                .aadhaarVerified(user.isAadhaarVerified())
                .completionChecklist(checklist)
                .build();
    }

    private UserProfileResponse.TempleCompletionChecklist buildChecklist(Long templeId) {
        // Temple.verificationStatus is the DC's authoritative verdict on the temple
        // profile as a whole. It must override any in-flight staging status so that
        // the checklist reflects the ground truth rather than a stale workflow state.
        //   VERIFIED  → treat as APPROVED (DC accepted the profile)
        //   FLAGGED   → treat as FLAGGED  (DC raised an issue; TA must act)
        // For all other verificationStatus values (UNVERIFIED, UNDER_REVIEW) fall
        // through to the staging workflow for the most granular status.
        Temple temple = templeRepository.findById(templeId).orElse(null);
        if (temple != null && temple.getVerificationStatus() == VerificationStatus.VERIFIED) {
            // Short-circuit: no need to inspect staging — profile is verified.
            String profileStatus = "APPROVED";
            boolean trustExists = !trustRepository.findAllByTempleId(templeId).isEmpty();
            long employeeCount = employeeRepository.findAllByTempleId(templeId, PageRequest.of(0, 1)).getTotalElements();
            long contractorCount = contractorRepository.findAllByTempleId(templeId, PageRequest.of(0, 1)).getTotalElements();
            String declarationStatus = declarationRepository
                    .findAllByTempleId(templeId, PageRequest.of(0, 1))
                    .stream().findFirst().map(d -> d.getStatus().name()).orElse(null);
            return UserProfileResponse.TempleCompletionChecklist.builder()
                    .templeProfileStatus(profileStatus)
                    .trustExists(trustExists)
                    .employeeCount(employeeCount)
                    .contractorCount(contractorCount)
                    .latestDeclarationStatus(declarationStatus)
                    .build();
        }

        if (temple != null && temple.getVerificationStatus() == VerificationStatus.FLAGGED) {
            // DC flagged the profile — surface FLAGGED directly so the TA knows action is needed.
            boolean trustExists = !trustRepository.findAllByTempleId(templeId).isEmpty();
            long employeeCount = employeeRepository.findAllByTempleId(templeId, PageRequest.of(0, 1)).getTotalElements();
            long contractorCount = contractorRepository.findAllByTempleId(templeId, PageRequest.of(0, 1)).getTotalElements();
            String declarationStatus = declarationRepository
                    .findAllByTempleId(templeId, PageRequest.of(0, 1))
                    .stream().findFirst().map(d -> d.getStatus().name()).orElse(null);
            return UserProfileResponse.TempleCompletionChecklist.builder()
                    .templeProfileStatus("FLAGGED")
                    .trustExists(trustExists)
                    .employeeCount(employeeCount)
                    .contractorCount(contractorCount)
                    .latestDeclarationStatus(declarationStatus)
                    .build();
        }

        // Fall through: derive status from the staging workflow (DRAFT/SUBMITTED/APPROVED/REJECTED)
        String profileStatus = stagingRepository
                .findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                        templeId,
                        List.of(com.templeregistry.entity.workflow.WorkflowStatus.DRAFT,
                                com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED,
                                com.templeregistry.entity.workflow.WorkflowStatus.APPROVED))
                .map(s -> {
                    WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, s.getId());
                    return instance.getStatus().name();
                })
                .orElse(null);

        boolean trustExists = !trustRepository.findAllByTempleId(templeId).isEmpty();

        long employeeCount = employeeRepository.findAllByTempleId(
                templeId, PageRequest.of(0, 1)).getTotalElements();

        long contractorCount = contractorRepository.findAllByTempleId(
                templeId, PageRequest.of(0, 1)).getTotalElements();

        // Latest declaration status
        String declarationStatus = declarationRepository
                .findAllByTempleId(templeId, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .map(d -> d.getStatus().name())
                .orElse(null);

        return UserProfileResponse.TempleCompletionChecklist.builder()
                .templeProfileStatus(profileStatus)
                .trustExists(trustExists)
                .employeeCount(employeeCount)
                .contractorCount(contractorCount)
                .latestDeclarationStatus(declarationStatus)
                .build();
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }
}
