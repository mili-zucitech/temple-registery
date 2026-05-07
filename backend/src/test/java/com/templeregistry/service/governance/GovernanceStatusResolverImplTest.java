package com.templeregistry.service.governance;

import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.governance.impl.GovernanceStatusResolverImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GovernanceStatusResolverImplTest {

    @Mock
    private WorkflowInstanceRepository instanceRepo;

    @InjectMocks
    private GovernanceStatusResolverImpl resolver;

    private WorkflowInstance approvedInstance;
    private WorkflowInstance clarificationInstance;
    private WorkflowInstance overdueInstance;

    @BeforeEach
    void setUp() {
        approvedInstance = WorkflowInstance.builder()
                .id(1L)
                .entityType(WorkflowEntityType.TRUST)
                .entityId(10L)
                .status(WorkflowStatus.APPROVED)
                .submittedAt(Instant.parse("2024-01-01T00:00:00Z"))
                .build();

        clarificationInstance = WorkflowInstance.builder()
                .id(2L)
                .entityType(WorkflowEntityType.DECLARATION)
                .entityId(20L)
                .status(WorkflowStatus.CLARIFICATION_REQUESTED)
                .submittedAt(Instant.parse("2024-01-15T00:00:00Z"))
                .build();

        overdueInstance = WorkflowInstance.builder()
                .id(3L)
                .entityType(WorkflowEntityType.DECLARATION)
                .entityId(30L)
                .status(WorkflowStatus.OVERDUE)
                .deadlineAt(Instant.parse("2024-01-10T00:00:00Z"))
                .build();
    }

    @Test
    void should_returnApprovedPayload_when_workflowInstanceIsApproved() {
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TRUST, 10L))
                .thenReturn(Optional.of(approvedInstance));

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.TRUST, 10L);

        assertThat(payload.getStatus()).isEqualTo("APPROVED");
        assertThat(payload.getSeverity()).isEqualTo("SUCCESS");
        assertThat(payload.getActionableBy()).isNull();
        assertThat(payload.isRequiresComment()).isFalse();
        assertThat(payload.getLabel()).isEqualTo("Approved");
        assertThat(payload.getWorkflowInstanceId()).isEqualTo(1L);
    }

    @Test
    void should_returnClarificationWarning_when_statusIsClarificationRequested() {
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.DECLARATION, 20L))
                .thenReturn(Optional.of(clarificationInstance));

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.DECLARATION, 20L);

        assertThat(payload.getStatus()).isEqualTo("CLARIFICATION_REQUESTED");
        assertThat(payload.getSeverity()).isEqualTo("WARNING");
        assertThat(payload.getActionableBy()).isEqualTo("TA");
        assertThat(payload.isRequiresComment()).isTrue();
        assertThat(payload.getLabel()).isEqualTo("Clarification Required");
    }

    @Test
    void should_returnOverdueError_when_statusIsOverdue() {
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.DECLARATION, 30L))
                .thenReturn(Optional.of(overdueInstance));

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.DECLARATION, 30L);

        assertThat(payload.getStatus()).isEqualTo("OVERDUE");
        assertThat(payload.getSeverity()).isEqualTo("WARNING");
        assertThat(payload.getActionableBy()).isEqualTo("SYSTEM");
        assertThat(payload.isRequiresComment()).isFalse();
    }

    @Test
    void should_returnUnknownPayload_when_noWorkflowInstanceExists() {
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TRUST, 999L))
                .thenReturn(Optional.empty());

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.TRUST, 999L);

        assertThat(payload.getStatus()).isEqualTo("UNKNOWN");
        assertThat(payload.getSeverity()).isEqualTo("INFO");
        assertThat(payload.getLabel()).contains("No governance record");
        assertThat(payload.isRequiresComment()).isFalse();
    }

    @Test
    void should_returnDcActionable_when_statusIsSubmitted() {
        WorkflowInstance submitted = WorkflowInstance.builder()
                .id(4L)
                .entityType(WorkflowEntityType.TRUST)
                .entityId(40L)
                .status(WorkflowStatus.SUBMITTED)
                .submittedAt(Instant.now())
                .build();
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TRUST, 40L))
                .thenReturn(Optional.of(submitted));

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.TRUST, 40L);

        assertThat(payload.getStatus()).isEqualTo("SUBMITTED");
        assertThat(payload.getSeverity()).isEqualTo("INFO");
        assertThat(payload.getActionableBy()).isEqualTo("DC");
        assertThat(payload.isRequiresComment()).isFalse();
    }

    @Test
    void should_returnErrorSeverity_when_statusIsRejected() {
        WorkflowInstance rejected = WorkflowInstance.builder()
                .id(5L)
                .entityType(WorkflowEntityType.TRUST)
                .entityId(50L)
                .status(WorkflowStatus.REJECTED)
                .build();
        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.TRUST, 50L))
                .thenReturn(Optional.of(rejected));

        GovernanceStatusPayload payload = resolver.resolve(WorkflowEntityType.TRUST, 50L);

        assertThat(payload.getStatus()).isEqualTo("REJECTED");
        assertThat(payload.getSeverity()).isEqualTo("ERROR");
        assertThat(payload.getActionableBy()).isNull();
        assertThat(payload.isRequiresComment()).isTrue();
    }

    @Test
    void should_resolveFromInstance_directly_without_repository_lookup() {
        GovernanceStatusPayload payload = resolver.resolveFromInstance(approvedInstance);

        assertThat(payload.getStatus()).isEqualTo("APPROVED");
        assertThat(payload.getWorkflowInstanceId()).isEqualTo(1L);
    }
}
