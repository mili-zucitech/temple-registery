package com.templeregistry.service.impl.admin;

import com.templeregistry.dto.request.admin.UpdateSystemConfigRequest;
import com.templeregistry.dto.response.admin.SystemConfigResponse;
import com.templeregistry.entity.config.SystemConfig;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.config.SystemConfigRepository;
import com.templeregistry.service.audit.AuditService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemConfigServiceImplTest {

    @Mock private SystemConfigRepository systemConfigRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private SystemConfigServiceImpl systemConfigService;

    private SystemConfig buildConfig(Long id, String key, String value, String dataType, String category) {
        SystemConfig c = new SystemConfig();
        c.setId(id);
        c.setConfigKey(key);
        c.setConfigValue(value);
        c.setDataType(dataType);
        c.setCategory(category);
        c.setActive(true);
        return c;
    }

    // ── listAll ───────────────────────────────────────────────────────────────

    @Test
    void should_returnAllConfigs_when_categoryIsNull() {
        SystemConfig c1 = buildConfig(1L, "sla.declaration.review_days", "7", "INTEGER", "SLA");
        SystemConfig c2 = buildConfig(2L, "notification.email.enabled", "true", "BOOLEAN", "NOTIFICATION");
        when(systemConfigRepository.findAllByDeletedFalse()).thenReturn(List.of(c1, c2));

        List<SystemConfigResponse> result = systemConfigService.listAll(null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getConfigKey()).isEqualTo("sla.declaration.review_days");
        assertThat(result.get(1).getConfigKey()).isEqualTo("notification.email.enabled");
    }

    @Test
    void should_returnFilteredConfigs_when_categoryProvided() {
        SystemConfig c1 = buildConfig(1L, "sla.declaration.review_days", "7", "INTEGER", "SLA");
        when(systemConfigRepository.findByCategoryAndDeletedFalse("SLA")).thenReturn(List.of(c1));

        List<SystemConfigResponse> result = systemConfigService.listAll("SLA");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("SLA");
        verify(systemConfigRepository).findByCategoryAndDeletedFalse("SLA");
        verify(systemConfigRepository, never()).findAllByDeletedFalse();
    }

    @Test
    void should_returnEmptyList_when_noConfigsExist() {
        when(systemConfigRepository.findAllByDeletedFalse()).thenReturn(List.of());

        List<SystemConfigResponse> result = systemConfigService.listAll(null);

        assertThat(result).isEmpty();
    }

    // ── getByKey ──────────────────────────────────────────────────────────────

    @Test
    void should_returnConfig_when_keyExists() {
        SystemConfig c = buildConfig(1L, "sla.declaration.review_days", "7", "INTEGER", "SLA");
        when(systemConfigRepository.findByConfigKeyAndDeletedFalse("sla.declaration.review_days"))
                .thenReturn(Optional.of(c));

        SystemConfigResponse result = systemConfigService.getByKey("sla.declaration.review_days");

        assertThat(result.getConfigKey()).isEqualTo("sla.declaration.review_days");
        assertThat(result.getConfigValue()).isEqualTo("7");
    }

    @Test
    void should_throwEntityNotFoundException_when_keyDoesNotExist() {
        when(systemConfigRepository.findByConfigKeyAndDeletedFalse("missing.key"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> systemConfigService.getByKey("missing.key"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    void should_updateConfigValue_when_validKeyAndRequest() {
        SystemConfig c = buildConfig(1L, "sla.declaration.review_days", "7", "INTEGER", "SLA");
        when(systemConfigRepository.findByConfigKeyAndDeletedFalse("sla.declaration.review_days"))
                .thenReturn(Optional.of(c));
        when(systemConfigRepository.save(any(SystemConfig.class))).thenAnswer(i -> i.getArgument(0));

        UpdateSystemConfigRequest req = new UpdateSystemConfigRequest();
        req.setConfigValue("14");

        SystemConfigResponse result = systemConfigService.update("sla.declaration.review_days", req, 1L);

        assertThat(result.getConfigValue()).isEqualTo("14");
        verify(systemConfigRepository).save(any(SystemConfig.class));
    }

    @Test
    void should_logAuditEvent_when_configUpdated() {
        SystemConfig c = buildConfig(1L, "sla.declaration.review_days", "7", "INTEGER", "SLA");
        when(systemConfigRepository.findByConfigKeyAndDeletedFalse("sla.declaration.review_days"))
                .thenReturn(Optional.of(c));
        when(systemConfigRepository.save(any(SystemConfig.class))).thenAnswer(i -> i.getArgument(0));

        UpdateSystemConfigRequest req = new UpdateSystemConfigRequest();
        req.setConfigValue("21");

        systemConfigService.update("sla.declaration.review_days", req, 99L);

        verify(auditService).logDataEvent(eq(99L), eq("SUPER_ADMIN"), eq("UPDATE_SYSTEM_CONFIG"),
                eq("SYSTEM_CONFIG"), eq(1L), contains("sla.declaration.review_days"));
    }

    @Test
    void should_throwEntityNotFoundException_when_updatingMissingKey() {
        when(systemConfigRepository.findByConfigKeyAndDeletedFalse("unknown.key"))
                .thenReturn(Optional.empty());

        UpdateSystemConfigRequest req = new UpdateSystemConfigRequest();
        req.setConfigValue("1");

        assertThatThrownBy(() -> systemConfigService.update("unknown.key", req, 1L))
                .isInstanceOf(EntityNotFoundException.class);

        verify(systemConfigRepository, never()).save(any());
        verify(auditService, never()).logDataEvent(any(), any(), any(), any(), any(), any());
    }
}
