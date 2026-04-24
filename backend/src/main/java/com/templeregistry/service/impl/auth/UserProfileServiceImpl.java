package com.templeregistry.service.impl.auth;

import com.templeregistry.dto.response.auth.UserProfileResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
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
    private final TrustRepository trustRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractorRepository contractorRepository;
    private final DeclarationRepository declarationRepository;

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
                .isActive(user.isActive())
                .districtId(user.getDistrictId())
                .templeId(user.getTempleId())
                .aadhaarVerified(user.isAadhaarVerified())
                .completionChecklist(checklist)
                .build();
    }

    private UserProfileResponse.TempleCompletionChecklist buildChecklist(Long templeId) {
        // Temple profile status — latest active staging or null
        String profileStatus = stagingRepository
                .findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                        templeId,
                        List.of(TempleProfileStagingStatus.DRAFT, TempleProfileStagingStatus.PENDING_REVIEW,
                                TempleProfileStagingStatus.APPROVED))
                .map(s -> s.getStatus() == TempleProfileStagingStatus.PENDING_REVIEW ? "SUBMITTED" : s.getStatus().name())
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
