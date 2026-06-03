package com.templeregistry.dto.response.accesscontrol;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.Map;

/**
 * Role × target-key permission matrix.
 * Used by the SA admin UI to display and edit the full policy grid.
 */
@Getter
@Builder
public class PolicyMatrixResponse {

    /** All distinct target keys registered in the system. */
    private List<String> targetKeys;

    /** All role names in the system. */
    private List<String> roles;

    /**
     * Outer key: targetKey. Inner key: role name. Value: "ALLOW" | "DENY" | "DEFAULT_ALLOW".
     * DEFAULT_ALLOW means no explicit policy row — structural @PreAuthorize governs.
     */
    private Map<String, Map<String, String>> matrix;
}
