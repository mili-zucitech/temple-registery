package com.templeregistry.service.workflow;

import com.templeregistry.dto.response.workflow.WorkflowEnvelope;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.clarification.ClarificationEngine;
import com.templeregistry.service.clarification.ClarificationSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * [P5] WorkflowEnvelopeAssembler
 *
 * Merges domain data with governance context from WorkflowEngine and ClarificationEngine.
 * Provides the "single source of truth" JSON for the frontend.
 */
@Service
@RequiredArgsConstructor
public class WorkflowEnvelopeAssembler {

    private final WorkflowEngine workflowEngine;
    private final ClarificationEngine clarificationEngine;
    private final VersionService versionService;

    public <T> WorkflowEnvelope<T> assemble(WorkflowEntityType type, Long entityId, T domainData, ActionContext context) {
        WorkflowInstance instance = workflowEngine.getState(type, entityId);
        List<AvailableAction> actions = workflowEngine.getAvailableActions(instance.getId(), context);
        ClarificationSummary clarification = clarificationEngine.getSummary(instance.getId());

        WorkflowEnvelope.WorkflowSummary workflowSummary = WorkflowEnvelope.WorkflowSummary.builder()
            .instanceId(instance.getId())
            .entityType(type.name())
            .status(instance.getStatus().name())
            .subStatus(instance.getSubStatus())
            .version((long) instance.getVersionNumber())
            .currentActor(instance.getCurrentActorRole() != null ? instance.getCurrentActorRole() : "SYSTEM")
            .submittedAt(format(instance.getSubmittedAt()))
            .statusUpdatedAt(format(instance.getStatusUpdatedAt()))
            .deadlineAt(format(instance.getDeadlineAt()))
            .availableActions(actions)
            .hasUnapprovedChanges(!instance.isApproved())
            .build();

        return WorkflowEnvelope.<T>builder()
            .data(domainData)
            .workflow(workflowSummary)
            .clarification(clarification)
            .build();
    }

    private String format(java.time.Instant instant) {
        if (instant == null) return null;
        return DateTimeFormatter.ISO_INSTANT.format(instant);
    }

    private String format(java.time.LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return DateTimeFormatter.ISO_LOCAL_DATE_TIME.format(dateTime);
    }
}
