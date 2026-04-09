package com.templeregistry.dto.request.dc;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for the DC approve declaration workflow action.
 * Remarks are optional — approval is unambiguous without a comment.
 * dc_e2e Section 5.2.
 */
@Getter
@NoArgsConstructor
public class WorkflowApproveRequest {

    @Size(max = 2000, message = "Remarks must not exceed 2000 characters.")
    private String remarks;
}
