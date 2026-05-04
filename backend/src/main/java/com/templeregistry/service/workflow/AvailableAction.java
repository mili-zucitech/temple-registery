package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import lombok.Builder;
import lombok.Getter;

/**
 * An action available to the current user on a workflow instance.
 * Returned in the availableActions array of the WorkflowEnvelope.
 * UI uses this to render action buttons with correct labels and behavior hints.
 */
@Getter
@Builder
public class AvailableAction {

    private final WorkflowAction action;

    /** Human-readable label for UI button. */
    private final String label;

    /** True if the UI must provide a comment/reason for this action. */
    private final boolean requiresComment;

    /** True if the UI must include the current version in the request body. */
    private final boolean requiresVersion;

    /** Optional confirmation dialog text shown before executing. */
    private final String confirmationMessage;
}
