package com.templeregistry.service.impl.admin;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.dto.request.admin.UpdateUserRequest;
import com.templeregistry.dto.response.admin.UserAdminResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.admin.AdminService;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TempleSearchSummaryService searchSummaryService;
    private final AuditService auditService;
    private final PaginationUtil paginationUtil;

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public PaginatedResponse<UserAdminResponse> listUsers(int page, int size) {
        Page<User> result = userRepository.findAll(PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public UserAdminResponse getUserById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public UserAdminResponse createUser(CreateUserRequest rq) {
        if (userRepository.existsByUsername(rq.getUsername())) {
            throw new DuplicateResourceException("User", "username", rq.getUsername());
        }
        if (userRepository.existsByEmail(rq.getEmail())) {
            throw new DuplicateResourceException("User", "email", rq.getEmail());
        }
        User user = User.builder()
                .username(rq.getUsername()).email(rq.getEmail())
                .passwordHash(passwordEncoder.encode(rq.getPassword()))
                .fullName(rq.getFullName()).mobile(rq.getMobile())
                .role(rq.getRole()).districtId(rq.getDistrictId()).templeId(rq.getTempleId())
                .isActive(true).build();
        User saved = userRepository.save(user);
        auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "CREATE_USER",
                "User", saved.getId(), "Created user: " + saved.getUsername());
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public UserAdminResponse updateUser(Long id, UpdateUserRequest rq) {
        User user = findOrThrow(id);
        if (rq.getEmail() != null) user.setEmail(rq.getEmail());
        if (rq.getFullName() != null) user.setFullName(rq.getFullName());
        if (rq.getPassword() != null && !rq.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(rq.getPassword()));
            log.info("Password reset for user [{}]", id);
            auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "RESET_PASSWORD",
                    "User", id, "Password reset by admin");
        }
        if (rq.getMobile() != null) user.setMobile(rq.getMobile());
        if (rq.getRole() != null) user.setRole(rq.getRole());
        if (rq.getActive() != null) user.setActive(rq.getActive());
        if (rq.getDistrictId() != null) user.setDistrictId(rq.getDistrictId());
        if (rq.getTempleId() != null) user.setTempleId(rq.getTempleId());
        User saved = userRepository.save(user);
        auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "UPDATE_USER",
                "User", id, "Updated user details");
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void deactivateUser(Long id) {
        User user = findOrThrow(id);
        user.setActive(false);
        userRepository.save(user);
        auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "DEACTIVATE_USER",
                "User", id, "Deactivated user");
        log.info("User [{}] deactivated.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void activateUser(Long id) {
        User user = findOrThrow(id);
        user.setActive(true);
        userRepository.save(user);
        auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "ACTIVATE_USER",
                "User", id, "Activated user");
        log.info("User [{}] activated.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public void rebuildSearchSummary() {
        searchSummaryService.rebuildAll();
        auditService.logDataEvent(currentActorId(), "SUPER_ADMIN", "REBUILD_SEARCH_SUMMARY",
                "System", 0L, "Triggered manual rebuild");
    }

    private Long currentActorId() {
        var principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims) {
            return ((ScopeHelper.Claims) principal).userId();
        }
        return 0L;
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User", id));
    }

    private UserAdminResponse toResponse(User u) {
        return UserAdminResponse.builder()
                .id(u.getId()).username(u.getUsername()).email(u.getEmail())
                .fullName(u.getFullName()).mobile(u.getMobile()).role(u.getRole())
                .active(u.isActive()).aadhaarVerified(u.isAadhaarVerified())
                .districtId(u.getDistrictId()).templeId(u.getTempleId())
                .lastLoginAt(u.getLastLoginAt()).createdAt(u.getCreatedAt()).build();
    }
}
