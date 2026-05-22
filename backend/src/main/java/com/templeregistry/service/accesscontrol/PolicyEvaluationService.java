package com.templeregistry.service.accesscontrol;

import com.templeregistry.dto.response.accesscontrol.EffectivePermissionsResponse;

/**
 * Evaluates effective DACVM policies for a given subject (role or user).
 * Results are cached in the {@code dacvmPolicies} Caffeine cache.
 */
public interface PolicyEvaluationService {

    /**
     * Evaluate whether {@code subjectValue} (role name or user ID string) of
     * {@code subjectType} is allowed to access {@code targetKey}.
     *
     * <p>SUPER_ADMIN is always ALLOW regardless of any policy.</p>
     *
     * @return true if access is allowed, false if denied
     */
    boolean isAllowed(String targetKey, String subjectType, String subjectValue);

    /**
     * Batch-evaluate all known target keys for the given principal and return
     * a full effective permissions map including field masks.
     * Used by GET /api/v1/auth/me/permissions.
     *
     * @param role      principal's role string
     * @param userId    principal's user ID
     */
    EffectivePermissionsResponse getEffectivePermissions(String role, Long userId);

    /**
     * Invalidate cache entries for {@code targetKey}.
     * Called after any policy change for that key.
     */
    void invalidateCache(String targetKey);

    /** Invalidate all cache entries for a given subject (e.g. user-level override changes). */
    void invalidateCacheForSubject(String subjectType, String subjectValue);
}
