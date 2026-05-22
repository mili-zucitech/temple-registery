package com.templeregistry.dto.response.accesscontrol;

import lombok.Builder;
import lombok.Getter;

import java.util.Map;

/**
 * Effective permissions for the currently authenticated user.
 * Returned by GET /api/v1/auth/me/permissions.
 *
 * <p>{@code permissions}: map of targetKey → "ALLOW" | "DENY"</p>
 * <p>{@code fieldMasks}: map of fieldKey → mask pattern string (only keys where masking is active)</p>
 */
@Getter
@Builder
public class EffectivePermissionsResponse {

    /** targetKey → "ALLOW" | "DENY" */
    private Map<String, String> permissions;

    /** fieldKey → maskPattern (e.g. "****"). Only present when masking is enabled. */
    private Map<String, String> fieldMasks;
}
