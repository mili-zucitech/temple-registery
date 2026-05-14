package com.templeregistry.service.impl.admin;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.admin.CreateUserRequest;
import com.templeregistry.dto.request.admin.UpdateUserRequest;
import com.templeregistry.dto.response.admin.UserAdminResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.geo.CityRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.temple.TempleRepository;
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

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final TempleRepository templeRepository;
    private final DistrictRepository districtRepository;
    private final CityRepository cityRepository;
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

        Long templeId = null;

        if (rq.getRole() == UserRole.TEMPLE_AUTHORITY) {
            // Validate fields required for Temple Authority
            if (rq.getTempleName() == null || rq.getTempleName().isBlank()) {
                throw new IllegalStateException("Temple name is required when creating a Temple Authority user.");
            }
            if (rq.getDistrictId() == null) {
                throw new IllegalStateException("District is required when creating a Temple Authority user.");
            }

            // Auto-create a minimal temple record in the same transaction
            String registrationNumber = generateTempleRegistrationNumber();
            Temple temple = Temple.builder()
                    .registrationNumber(registrationNumber)
                    .name(rq.getTempleName())
                    .grade(TempleGrade.C)
                    .primaryDeity("To be updated")
                    .districtId(rq.getDistrictId())
                    .status(TempleStatus.ACTIVE)
                    .trustRegistered(false)
                    .build();
            Temple savedTemple = templeRepository.save(temple);
            templeId = savedTemple.getId();

            // Schedule search summary after commit
            searchSummaryService.scheduleRefresh(templeId);

            log.info("Auto-created temple [id={}, regNo={}, name='{}'] for new TA user '{}'",
                    templeId, registrationNumber, rq.getTempleName(), rq.getUsername());
        }

        User user = User.builder()
                .username(rq.getUsername()).email(rq.getEmail())
                .passwordHash(passwordEncoder.encode(rq.getPassword()))
                .fullName(rq.getFullName()).mobile(rq.getMobile())
                .role(rq.getRole()).districtId(rq.getDistrictId())
                .cityId(rq.getCityId())
                .templeId(templeId)
                .aadhaarNumber(rq.getAadhaarNumber())
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
        if (rq.getCityId() != null) user.setCityId(rq.getCityId());
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
        if (user.getTempleId() != null) {
            searchSummaryService.scheduleRefresh(user.getTempleId());
        }
        log.info("User [{}] activated.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public void refreshTempleSearchSummary(Long templeId) {
        searchSummaryService.refresh(templeId);
        log.info("Manual search summary refresh triggered for temple [{}]", templeId);
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
        String districtName = u.getDistrictId() != null
                ? districtRepository.findById(u.getDistrictId()).map(d -> d.getName()).orElse(null)
                : null;
        String templeName = u.getTempleId() != null
                ? templeRepository.findById(u.getTempleId()).map(t -> t.getName()).orElse(null)
                : null;
        return UserAdminResponse.builder()
                .id(u.getId()).username(u.getUsername()).email(u.getEmail())
                .fullName(u.getFullName()).mobile(u.getMobile()).role(u.getRole())
                .active(u.isActive()).aadhaarVerified(u.isAadhaarVerified())
                .aadhaarNumber(u.getAadhaarNumber())
                .districtId(u.getDistrictId()).districtName(districtName)
                .cityId(u.getCityId())
                .templeId(u.getTempleId()).templeName(templeName)
                .lastLoginAt(u.getLastLoginAt()).createdAt(u.getCreatedAt()).build();
    }

    /** Generates a unique temple registration number in the format KA-TMP-{UUID8}. */
    private static String generateTempleRegistrationNumber() {
        String uuid8 = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "KA-TMP-" + uuid8;
    }
}
