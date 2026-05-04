package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import lombok.Builder;
import lombok.Getter;

/**
 * Command object for executing a workflow action.
 * Immutable — built by controller and passed through the engine.
 */
@Getter
@Builder
public class WorkflowActionRequest {

    /** The action to execute. Required. */
    private final WorkflowAction action;

    /**
     * Client-supplied expected version (from workflow.version in previous API response).
     * Must match workflow_instance.lock_version to prevent stale writes.
     * Required for all TA and DC actions. Not required for SYSTEM actions.
     */
    private final Long expectedVersion;

    /**
     * UUID v4 supplied by the client for idempotency.
     * If this key was seen before, return the cached result.
     * Required for state-changing actions. Optional for read operations.
     */
    private final String idempotencyKey;

    /** Optional free-text reason/comment (required for REJECT, REQUEST_CLARIFICATION, SEND_BACK). */
    private final String comment;
}
