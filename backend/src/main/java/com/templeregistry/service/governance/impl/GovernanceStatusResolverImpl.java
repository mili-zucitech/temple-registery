package com.templeregistry.service.governance.impl;

import com.templeregistry.dto.response.governance.GovernanceStatusPayload;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.service.governance.GovernanceStatusResolver;
import com.templeregistry.service.workflow.TransitionRuleRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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
    private final TransitionRuleRegistry ruleRegistry;
    private final WorkflowTransitionRepository transitionRepo;

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
        String actionableBy = actionableByFor(status);
        String entityTypeName = wi.getEntityType().name();
        List<String> allowedActions = allowedActionsFor(entityTypeName, status, actionableBy);

        // Fetch rejection reason for REJECTED and RE_APPROVED statuses.
        // For REJECTED: terminal state — the latest transition is always the rejection.
        // For RE_APPROVED: two sub-cases exist:
        //   a) Edit was rejected (REJECT_EDIT) → entity reverted to approved snapshot (latestRejectionReason populated)
        //   b) DC re-approved a resubmission → the latest transition is APPROVE, not REJECT.
        //      In this case latestRejectionReason must be null — "currently re-approved, not rejected."
        // We distinguish by inspecting only the most recent transition's action.
        // findLatestRejectByInstanceId is intentionally NOT used here: it ignores subsequent
        // APPROVE transitions and would surface a stale rejection reason after DC re-approves.
        String rejectionReason = null;
        String latestRejectionReason = null;
        if (status == WorkflowStatus.REJECTED || status == WorkflowStatus.RE_APPROVED) {
            var latestTransition = transitionRepo.findLatestByInstanceId(wi.getId());
            boolean latestWasReject = latestTransition
                    .map(t -> t.getAction() == WorkflowAction.REJECT || t.getAction() == WorkflowAction.REJECT_EDIT)
                    .orElse(false);
            if (latestWasReject) {
                latestRejectionReason = latestTransition.map(t -> t.getComment()).orElse(null);
            }
            if (status == WorkflowStatus.REJECTED) {
                // REJECTED is terminal — the last transition is always the rejection
                rejectionReason = latestRejectionReason;
            }
        }
        return GovernanceStatusPayload.builder()
                .status(status.name())
                .subStatus(wi.getSubStatus())
                .label(labelFor(status))
                .severity(severityFor(status))
                .actionableBy(actionableBy)
                .requiresComment(requiresCommentFor(status))
                .pendingSince(wi.getSubmittedAt())
                .deadline(wi.getDeadlineAt())
                .workflowInstanceId(wi.getId())
                .allowedActions(allowedActions)
                .rejectionReason(rejectionReason)
                .latestRejectionReason(latestRejectionReason)
                .build();
    }

    private List<String> allowedActionsFor(String entityType, WorkflowStatus status, String actorRole) {
        if (actorRole == null) {
            return List.of();
        }
        return ruleRegistry.findAllForStatus(entityType, status).stream()
                .filter(r -> actorRole.equals(r.getRequiredRole()))
                .map(r -> r.getAction().name())
                .distinct()
                .collect(Collectors.toList());
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
                 UPDATED_AFTER_APPROVAL,
                 REJECTED               -> "TA";
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
