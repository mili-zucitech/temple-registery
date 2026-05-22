package com.templeregistry.service.impl.accesscontrol;

import com.templeregistry.entity.accesscontrol.AccessControlAuditLog;
import com.templeregistry.entity.accesscontrol.enums.AuditChangeType;
import com.templeregistry.repository.accesscontrol.AccessControlAuditLogRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccessControlAuditServiceImplTest {

    @Mock AccessControlAuditLogRepository auditLogRepository;
    @InjectMocks AccessControlAuditServiceImpl service;

    // ─── logPolicyChange ──────────────────────────────────────────────────────

    @Nested
    class LogPolicyChange {

        @Test
        void should_saveAuditLog_when_createEventRecorded() {
            service.logPolicyChange(42L, AuditChangeType.CREATE, null, "{\"effect\":\"DENY\"}", 1L, "127.0.0.1");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AccessControlAuditLog log = captor.getValue();
            assertThat(log.getPolicyId()).isEqualTo(42L);
            assertThat(log.getChangeType()).isEqualTo(AuditChangeType.CREATE);
            assertThat(log.getOldValue()).isNull();
            assertThat(log.getNewValue()).contains("DENY");
            assertThat(log.getChangedByUserId()).isEqualTo(1L);
            assertThat(log.getIpAddress()).isEqualTo("127.0.0.1");
            assertThat(log.getFieldMaskId()).isNull();
        }

        @Test
        void should_saveAuditLog_when_updateEventRecorded() {
            service.logPolicyChange(10L, AuditChangeType.UPDATE,
                    "{\"effect\":\"ALLOW\"}", "{\"effect\":\"DENY\"}", 5L, "10.0.0.1");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AccessControlAuditLog log = captor.getValue();
            assertThat(log.getPolicyId()).isEqualTo(10L);
            assertThat(log.getChangeType()).isEqualTo(AuditChangeType.UPDATE);
            assertThat(log.getOldValue()).contains("ALLOW");
            assertThat(log.getNewValue()).contains("DENY");
        }

        @Test
        void should_saveAuditLog_when_deleteEventHasNullNewValue() {
            service.logPolicyChange(7L, AuditChangeType.DELETE, "{\"effect\":\"DENY\"}", null, 99L, "192.168.1.1");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AccessControlAuditLog log = captor.getValue();
            assertThat(log.getChangeType()).isEqualTo(AuditChangeType.DELETE);
            assertThat(log.getOldValue()).contains("DENY");
            assertThat(log.getNewValue()).isNull();
        }

        @Test
        void should_recordChangedAt_when_logPolicyChangeCalled() {
            service.logPolicyChange(1L, AuditChangeType.CREATE, null, "{}", 2L, "10.0.0.2");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());
            assertThat(captor.getValue().getChangedAt()).isNotNull();
        }
    }

    // ─── logFieldMaskChange ───────────────────────────────────────────────────

    @Nested
    class LogFieldMaskChange {

        @Test
        void should_saveAuditLog_when_fieldMaskCreated() {
            service.logFieldMaskChange(7L, AuditChangeType.CREATE,
                    null, "{\"maskPattern\":\"****\"}", 3L, "10.0.0.2");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AccessControlAuditLog log = captor.getValue();
            assertThat(log.getFieldMaskId()).isEqualTo(7L);
            assertThat(log.getChangeType()).isEqualTo(AuditChangeType.CREATE);
            assertThat(log.getNewValue()).contains("****");
            assertThat(log.getPolicyId()).isNull();
        }

        @Test
        void should_saveAuditLog_when_fieldMaskDeleted() {
            service.logFieldMaskChange(5L, AuditChangeType.DELETE,
                    "{\"maskPattern\":\"XX-XX\"}", null, 1L, "192.168.0.1");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());

            AccessControlAuditLog log = captor.getValue();
            assertThat(log.getFieldMaskId()).isEqualTo(5L);
            assertThat(log.getOldValue()).contains("XX-XX");
            assertThat(log.getNewValue()).isNull();
        }

        @Test
        void should_recordChangedAt_when_logFieldMaskChangeCalled() {
            service.logFieldMaskChange(2L, AuditChangeType.UPDATE, "{}", "{}", 4L, "10.10.0.1");

            ArgumentCaptor<AccessControlAuditLog> captor = ArgumentCaptor.forClass(AccessControlAuditLog.class);
            verify(auditLogRepository).save(captor.capture());
            assertThat(captor.getValue().getChangedAt()).isNotNull();
        }
    }
}
