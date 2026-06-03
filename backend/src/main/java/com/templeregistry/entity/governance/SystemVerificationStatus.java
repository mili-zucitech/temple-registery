package com.templeregistry.entity.governance;

/**
 * Layer 2 of the 3-layer governance status model.
 *
 * INTERNAL ONLY — must NEVER be exposed to Temple Authority in any API response.
 * Set by automated system checks (not by DC manually).
 */
public enum SystemVerificationStatus {
    SYSTEM_VERIFIED,
    SYSTEM_FLAGGED,
    SYSTEM_INVALID
}
