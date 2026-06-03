package com.templeregistry.service.impl.audit;

import com.templeregistry.entity.audit.AuditDataEvent;
import com.templeregistry.entity.audit.AuditAuthEvent;
import com.templeregistry.entity.audit.AuditExportEvent;
import com.templeregistry.repository.audit.AuditAuthEventRepository;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.repository.audit.AuditExportEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

    @Mock private AuditDataEventRepository dataEventRepository;
    @Mock private AuditAuthEventRepository authEventRepository;
    @Mock private AuditExportEventRepository exportEventRepository;

    @InjectMocks
    private AuditServiceImpl auditService;

    // ── logDataEvent ──────────────────────────────────────────────────────────

    @Test
    void should_saveDataEvent_when_logDataEventCalled() {
        when(dataEventRepository.save(any(AuditDataEvent.class)))
                .thenAnswer(i -> i.getArgument(0));

        auditService.logDataEvent(1L, "SUPER_ADMIN", "CREATE",
                "TEMPLE", 100L, "Created temple");

        ArgumentCaptor<AuditDataEvent> captor = ArgumentCaptor.forClass(AuditDataEvent.class);
        verify(dataEventRepository).save(captor.capture());
        AuditDataEvent saved = captor.getValue();
        assertThat(saved.getActorId()).isEqualTo(1L);
        assertThat(saved.getActorRole()).isEqualTo("SUPER_ADMIN");
        assertThat(saved.getAction()).isEqualTo("CREATE");
        assertThat(saved.getEntityType()).isEqualTo("TEMPLE");
        assertThat(saved.getEntityId()).isEqualTo(100L);
        assertThat(saved.getDetail()).isEqualTo("Created temple");
    }

    @Test
    void should_notThrow_when_dataEventRepositoryThrowsException() {
        doThrow(new RuntimeException("DB error"))
                .when(dataEventRepository).save(any(AuditDataEvent.class));

        // Should swallow exception and not propagate
        auditService.logDataEvent(1L, "SUPER_ADMIN", "CREATE", "TEMPLE", 100L, "detail");

        verify(dataEventRepository).save(any(AuditDataEvent.class));
    }

    // ── logAuthEvent ──────────────────────────────────────────────────────────

    @Test
    void should_saveAuthEvent_when_logAuthEventCalled() {
        when(authEventRepository.save(any(AuditAuthEvent.class)))
                .thenAnswer(i -> i.getArgument(0));

        auditService.logAuthEvent(42L, "admin_user", "LOGIN",
                "192.168.1.1", "SUCCESS", "Login via web");

        ArgumentCaptor<AuditAuthEvent> captor = ArgumentCaptor.forClass(AuditAuthEvent.class);
        verify(authEventRepository).save(captor.capture());
        AuditAuthEvent saved = captor.getValue();
        assertThat(saved.getUserId()).isEqualTo(42L);
        assertThat(saved.getUsername()).isEqualTo("admin_user");
        assertThat(saved.getEventType()).isEqualTo("LOGIN");
        assertThat(saved.getIpAddress()).isEqualTo("192.168.1.1");
        assertThat(saved.getOutcome()).isEqualTo("SUCCESS");
    }

    @Test
    void should_notThrow_when_authEventRepositoryThrowsException() {
        doThrow(new RuntimeException("DB error"))
                .when(authEventRepository).save(any(AuditAuthEvent.class));

        auditService.logAuthEvent(1L, "user", "LOGIN", "127.0.0.1", "FAILURE", "bad creds");

        verify(authEventRepository).save(any(AuditAuthEvent.class));
    }

    // ── logExportEvent ────────────────────────────────────────────────────────

    @Test
    void should_saveExportEvent_when_logExportEventCalled() {
        when(exportEventRepository.save(any(AuditExportEvent.class)))
                .thenAnswer(i -> i.getArgument(0));

        auditService.logExportEvent(5L, "DISTRICT_COLLECTOR", "TEMPLE_LIST",
                "district=10", 42);

        ArgumentCaptor<AuditExportEvent> captor = ArgumentCaptor.forClass(AuditExportEvent.class);
        verify(exportEventRepository).save(captor.capture());
        AuditExportEvent saved = captor.getValue();
        assertThat(saved.getActorId()).isEqualTo(5L);
        assertThat(saved.getActorRole()).isEqualTo("DISTRICT_COLLECTOR");
        assertThat(saved.getExportType()).isEqualTo("TEMPLE_LIST");
        assertThat(saved.getRecordCount()).isEqualTo(42);
    }

    @Test
    void should_notThrow_when_exportEventRepositoryThrowsException() {
        doThrow(new RuntimeException("DB error"))
                .when(exportEventRepository).save(any(AuditExportEvent.class));

        auditService.logExportEvent(1L, "SUPER_ADMIN", "EXPORT", "none", 0);

        verify(exportEventRepository).save(any(AuditExportEvent.class));
    }
}
