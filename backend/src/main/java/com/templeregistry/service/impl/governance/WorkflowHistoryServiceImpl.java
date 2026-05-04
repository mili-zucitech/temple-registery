package com.templeregistry.service.impl.governance;

import com.templeregistry.dto.response.governance.WorkflowHistoryResponse;
import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.workflow.WorkflowTransition;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.service.governance.WorkflowHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowHistoryServiceImpl implements WorkflowHistoryService {

    private final WorkflowTransitionRepository transitionRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowHistoryResponse> getHistory(Long workflowInstanceId) {
        List<WorkflowTransition> transitions = transitionRepo
            .findByWorkflowInstanceIdOrderByPerformedAtAsc(workflowInstanceId);

        // Batch load actor names
        List<Long> actorIds = transitions.stream()
            .map(WorkflowTransition::getActorId)
            .distinct()
            .toList();
        Map<Long, String> actorNames = userRepo.findAllById(actorIds).stream()
            .collect(Collectors.toMap(User::getId, User::getFullName));

        return transitions.stream()
            .map(t -> WorkflowHistoryResponse.builder()
                .transitionId(t.getId())
                .action(t.getAction().name())
                .actionLabel(formatActionLabel(t.getAction().name()))
                .actorId(t.getActorId())
                .actorName(actorNames.getOrDefault(t.getActorId(), "Unknown"))
                .actorRole(t.getActorRole())
                .fromStatus(t.getFromStatus() != null ? t.getFromStatus().name() : null)
                .toStatus(t.getToStatus().name())
                .fromSubStatus(t.getFromSubStatus())
                .toSubStatus(t.getToSubStatus())
                .comment(t.getComment())
                .timestamp(t.getPerformedAt())
                .version(t.getInstanceVersionAtTransition())
                .build())
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowHistoryResponse.Summary getHistorySummary(Long workflowInstanceId) {
        List<WorkflowTransition> transitions = transitionRepo
            .findByWorkflowInstanceIdOrderByPerformedAtDesc(workflowInstanceId);

        if (transitions.isEmpty()) {
            return WorkflowHistoryResponse.Summary.builder()
                .totalActions(0)
                .lastAction(null)
                .lastActionAt(null)
                .lastActionBy(null)
                .build();
        }

        WorkflowTransition latest = transitions.get(0);
        String actorName = userRepo.findById(latest.getActorId())
            .map(User::getFullName)
            .orElse("Unknown");

        return WorkflowHistoryResponse.Summary.builder()
            .totalActions(transitions.size())
            .lastAction(latest.getAction().name())
            .lastActionAt(latest.getPerformedAt())
            .lastActionBy(actorName)
            .build();
    }

    private String formatActionLabel(String action) {
        return switch (action) {
            case "SUBMIT"                -> "Submitted";
            case "APPROVE"               -> "Approved";
            case "RE_APPROVE"            -> "Re-Approved";
            case "REJECT"                -> "Rejected";
            case "REQUEST_CLARIFICATION" -> "Requested Clarification";
            case "RESPOND_CLARIFICATION" -> "Responded to Clarification";
            case "BEGIN_REVIEW"          -> "Began Review";
            case "RESUBMIT"              -> "Resubmitted";
            case "EDIT_APPROVED"         -> "Edited After Approval";
            case "WITHDRAW"              -> "Withdrawn";
            default                      -> action.replace("_", " ");
        };
    }
}
