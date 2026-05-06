package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.request.admin.UpdateSystemConfigRequest;
import com.templeregistry.dto.response.admin.SystemConfigResponse;
import com.templeregistry.entity.config.SystemConfig;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.config.SystemConfigRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.admin.SystemConfigService;
import com.templeregistry.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemConfigServiceImpl implements SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final AuditService auditService;

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public List<SystemConfigResponse> listAll(String category) {
        List<SystemConfig> configs = category != null
                ? systemConfigRepository.findByCategoryAndDeletedFalse(category)
                : systemConfigRepository.findAllByDeletedFalse();
        return configs.stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional(readOnly = true)
    public SystemConfigResponse getByKey(String key) {
        return toResponse(findOrThrow(key));
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public SystemConfigResponse update(String key, UpdateSystemConfigRequest request, Long actorUserId) {
        SystemConfig config = findOrThrow(key);
        String oldValue = config.getConfigValue();
        config.setConfigValue(request.getConfigValue());
        if (request.getDescription() != null) config.setDescription(request.getDescription());
        SystemConfig saved = systemConfigRepository.save(config);
        auditService.logDataEvent(actorUserId, "SUPER_ADMIN", "UPDATE_SYSTEM_CONFIG",
                "SYSTEM_CONFIG", saved.getId(),
                "key=" + key + " old=" + oldValue + " new=" + request.getConfigValue());
        log.info("SystemConfig [{}] updated by userId={} to value={}", key, actorUserId, request.getConfigValue());
        return toResponse(saved);
    }

    private SystemConfig findOrThrow(String key) {
        return systemConfigRepository.findByConfigKeyAndDeletedFalse(key)
                .orElseThrow(() -> new EntityNotFoundException(
                        "SystemConfig '" + key + "' not found", "SYSTEM_CONFIG_NOT_FOUND"));
    }

    private SystemConfigResponse toResponse(SystemConfig c) {
        return SystemConfigResponse.builder()
                .id(c.getId())
                .configKey(c.getConfigKey())
                .configValue(c.getConfigValue())
                .dataType(c.getDataType())
                .category(c.getCategory())
                .description(c.getDescription())
                .active(c.isActive())
                .build();
    }
}
