package com.templeregistry.service.governance.impl;

import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.governance.GovernanceStatusResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resolves the canonical {@link GovernanceStatusPayload} from {@link WorkflowInstance#getStatus()}.
 *
 * Single source of truth: all status labels, severities, and actionability
 * are derived here — never in DTOs, never in controllers, never in frontend JS.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GovernanceStatusResolverImpl implements GovernanceStatusResolver {

    private final WorkflowInstanceRepository instanceRepo;

    @Override
    @Transactional(readOnly = true)
    public GovernanceStatusPayload resolve(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
                .map(this::resolveFromInstance)
                .orElseGet(() -> {
                    log.warn("[GovernanceStatusResolver] No WorkflowInstance for {}:{} — backfill required",
                            entityType, entityId);
                    return GovernanceStatusPayload.unknown(entityType.name(), entityId);
                });
    }

    @Override
    public GovernanceStatusPayload resolveFromInstance(WorkflowInstance wi) {
        WorkflowStatus status = wi.getStatus();
        return GovernanceStatusPayload.builder()
                .status(status.name())
                .subStatus(wi.getSubStatus())
                .label(labelFor(status))
                .severity(severityFor(status))
                .actionableBy(actionableByFor(status))
                .requiresComment(requiresCommentFor(status))
                .pendingSince(wi.getSubmittedAt())
                .deadline(wi.getDeadlineAt())
                .workflowInstanceId(wi.getId())
                .build();
    }

    private String labelFor(WorkflowStatus status) {
        return switch (status) {
            case DRAFT                   -> "Draft — not submitted";
            case SUBMITTED               -> "Submitted — awaiting DC review";
            case UNDER_REVIEW            -> "Under Review by DC";
            case CLARIFICATION_REQUESTED -> "Clarification Required";
            case CLARIFICATION_RESPONDED -> "Clarification Responded — awaiting DC";
            case RESUBMITTED             -> "Resubmitted — awaiting DC review";
            case APPROVED                -> "Approved";
            case RE_APPROVED             -> "Re-Approved";
            case REJECTED                -> "Rejected";
            case UPDATED_AFTER_APPROVAL  -> "Edited — resubmission required";
            case OVERDUE                 -> "Overdue — deadline passed";
            case SUPERSEDED              -> "Superseded by newer version";
            case WITHDRAWN               -> "Withdrawn";
        };
    }

    private String severityFor(WorkflowStatus status) {
        return switch (status) {
            case APPROVED, RE_APPROVED              -> "SUCCESS";
            case CLARIFICATION_REQUESTED, OVERDUE   -> "WARNING";
            case REJECTED                           -> "ERROR";
            default                                 -> "INFO";
        };
    }

    private String actionableByFor(WorkflowStatus status) {
        return switch (status) {
            case SUBMITTED, UNDER_REVIEW,
                 CLARIFICATION_RESPONDED,
                 RESUBMITTED             -> "DC";
            case CLARIFICATION_REQUESTED,
                 UPDATED_AFTER_APPROVAL  -> "TA";
            case OVERDUE                 -> "SYSTEM";
            default                      -> null;
        };
    }

    private boolean requiresCommentFor(WorkflowStatus status) {
        // Rejection and send-back actions require a free-text reason
        return status == WorkflowStatus.CLARIFICATION_REQUESTED
                || status == WorkflowStatus.REJECTED;
    }
}
