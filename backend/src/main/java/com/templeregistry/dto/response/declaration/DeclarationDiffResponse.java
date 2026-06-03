package com.templeregistry.dto.response.declaration;

import lombok.Builder;
import lombok.Getter;

/**
 * Represents a single changed field between the submission snapshot and the current declaration state.
 * Used in GET /api/declarations/{id}/diff to show what changed since last submission.
 */
@Getter
@Builder
public class DeclarationDiffResponse {
    private String field;
    private String oldValue;
    private String newValue;
}
