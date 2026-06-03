package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.security.RoleConstants;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkflowEngineAdaptorTest {

    @Mock
    private WorkflowEngine workflowEngine;

    @Mock
    private WorkflowInstanceRepository instanceRepo;

    @InjectMocks
    private WorkflowEngineAdaptor adaptor;

    @Test
    void should_useSuperAdminRole_when_approveWithoutDistrict() {
        WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .entityId(11L)
                .status(WorkflowStatus.SUBMITTED)
                .build();
        ReflectionTestUtils.setField(instance, "id", 101L);

        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.DECLARATION, 11L))
                .thenReturn(Optional.of(instance));

        adaptor.adaptApprove(WorkflowEntityType.DECLARATION, 11L, null, 501L);

        ArgumentCaptor<ActionContext> contextCaptor = ArgumentCaptor.forClass(ActionContext.class);
        ArgumentCaptor<WorkflowActionRequest> requestCaptor = ArgumentCaptor.forClass(WorkflowActionRequest.class);
        verify(workflowEngine).execute(eq(101L), requestCaptor.capture(), contextCaptor.capture());

        assertThat(requestCaptor.getValue().getAction()).isEqualTo(WorkflowAction.APPROVE);
        assertThat(contextCaptor.getValue().getActorRole()).isEqualTo(RoleConstants.SUPER_ADMIN);
    }

    @Test
    void should_useDcRole_when_approveWithDistrict() {
        WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .entityId(12L)
                .status(WorkflowStatus.UNDER_REVIEW)
                .build();
        ReflectionTestUtils.setField(instance, "id", 102L);

        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.DECLARATION, 12L))
                .thenReturn(Optional.of(instance));

        adaptor.adaptApprove(WorkflowEntityType.DECLARATION, 12L, 7L, 502L);

        ArgumentCaptor<ActionContext> contextCaptor = ArgumentCaptor.forClass(ActionContext.class);
        verify(workflowEngine).execute(eq(102L), any(WorkflowActionRequest.class), contextCaptor.capture());

        assertThat(contextCaptor.getValue().getActorRole()).isEqualTo("DC");
        assertThat(contextCaptor.getValue().getActorDistrictId()).isEqualTo(7L);
    }

    @Test
    void should_useTaRole_when_submitFromDraft() {
        WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .entityId(13L)
                .status(WorkflowStatus.DRAFT)
                .build();
        ReflectionTestUtils.setField(instance, "id", 103L);

        when(instanceRepo.findByEntityTypeAndEntityId(WorkflowEntityType.DECLARATION, 13L))
                .thenReturn(Optional.of(instance));

        boolean transitioned = adaptor.adaptSubmit(WorkflowEntityType.DECLARATION, 13L, 900L, 9L, 503L);

        ArgumentCaptor<ActionContext> contextCaptor = ArgumentCaptor.forClass(ActionContext.class);
        ArgumentCaptor<WorkflowActionRequest> requestCaptor = ArgumentCaptor.forClass(WorkflowActionRequest.class);
        verify(workflowEngine).execute(eq(103L), requestCaptor.capture(), contextCaptor.capture());

        assertThat(transitioned).isTrue();
        assertThat(requestCaptor.getValue().getAction()).isEqualTo(WorkflowAction.SUBMIT);
        assertThat(contextCaptor.getValue().getActorRole()).isEqualTo("TA");
    }
}
