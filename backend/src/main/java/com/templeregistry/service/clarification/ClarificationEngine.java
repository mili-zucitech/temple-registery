package com.templeregistry.service.clarification;

import com.templeregistry.entity.clarification.ClarificationThread;
import com.templeregistry.entity.clarification.ClarificationMessage;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

/**
 * Unified Clarification Engine — handles all DC↔TA clarification for all modules.
 *
 * Replaces:
 *   - DeclarationClarification entity + service methods
 *   - Trust.sendBackReason string field
 *   - Missing Temple Profile clarification support
 *
 * Every clarification action also drives a workflow state transition via WorkflowEngine.
 * The engine is a COLLABORATOR of the WorkflowEngine — not embedded inside it.
 */
public interface ClarificationEngine {

    /**
     * DC opens a new clarification round on a workflow instance.
     * Automatically:
     *   - Creates clarification_thread (round++)
     *   - Creates initial clarification_message (direction=DC_TO_TA)
     *   - Calls WorkflowEngine.execute(REQUEST_CLARIFICATION) → status → CLARIFICATION_REQUESTED
     *   - Triggers notification to TA
     *
     * @throws WorkflowException if no open clarification allowed (e.g. escalation threshold reached)
     */
    ClarificationThread requestClarification(
        Long workflowInstanceId,
        ClarificationRequest request,
        Long requestedByUserId,
        String idempotencyKey
    );

    default ClarificationThread requestClarification(
        Long workflowInstanceId,
        ClarificationRequest request,
        Long requestedByUserId
    ) {
        return requestClarification(workflowInstanceId, request, requestedByUserId, null);
    }

    /**
     * TA responds to an open clarification thread.
     * Automatically:
     *   - Adds clarification_message (direction=TA_TO_DC)
     *   - Updates thread status → RESPONDED
     *   - Calls WorkflowEngine.execute(RESPOND_CLARIFICATION) → status → CLARIFICATION_RESPONDED
     *   - Triggers notification to DC
     */
    ClarificationMessage respond(
        Long threadId,
        ClarificationResponse response,
        Long respondedByUserId
    );

    /**
     * DC adds a follow-up question within an existing thread (same round).
     * Does NOT create a new round — adds message (direction=DC_TO_TA) to existing thread.
     * Thread status remains RESPONDED.
     */
    ClarificationMessage followUp(
        Long threadId,
        String message,
        Long dcUserId
    );

    /**
     * DC resolves the thread (accepts TA's response).
     * Thread status → RESOLVED.
     */
    void resolve(Long threadId, Long resolvedByUserId);

    /**
     * Get all threads for a workflow instance (full history, ordered by round ASC).
     */
    List<ClarificationThread> getThreads(Long workflowInstanceId);

    /**
     * Get clarification summary for workflow envelope.
     */
    ClarificationSummary getSummary(Long workflowInstanceId);
}
