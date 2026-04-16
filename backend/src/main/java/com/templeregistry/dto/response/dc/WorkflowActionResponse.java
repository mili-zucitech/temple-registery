package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

/**
 * Result of a declaration workflow action (approve / reject / clarify / flag-physical).
 *
 * On APPROVED: acknowledgementNumber is populated.
 * On all other actions: acknowledgementNumber is null.
 * dc_e2e Section 5.2.
 */
@Getter
@Builder
public class WorkflowActionResponse {

    private Long declarationId;

    /** The new status after the workflow action was applied. */
    private String newStatus;

    /** Populated only when the action results in APPROVED status. */
    private String acknowledgementNumber;

    /** Human-readable confirmation message. */
    private String message;
}
