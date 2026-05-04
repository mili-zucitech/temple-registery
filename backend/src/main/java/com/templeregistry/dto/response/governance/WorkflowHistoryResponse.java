package com.templeregistry.dto.response.governance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Workflow History Response — represents a single state transition in the audit trail.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowHistoryResponse {

    private Long transitionId;
    private String action;
    private String actionLabel;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private String fromStatus;
    private String toStatus;
    private String fromSubStatus;
    private String toSubStatus;
    private String comment;
    private Instant timestamp;
    private Long version;

    /**
     * Condensed summary for WorkflowEnvelope.auditSummary.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary {
        private Integer totalActions;
        private String lastAction;
        private Instant lastActionAt;
        private String lastActionBy;
    }
}
