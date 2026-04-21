package com.templeregistry.entity.trust;

/**
 * Trust governance structure types.
 * Aligned with frontend TRUST_TYPES constant in trustTypes.ts.
 *
 * Legacy values PUBLIC and PRIVATE are retained for backward compatibility
 * with existing DB rows. V34 migration migrates them to MULTI_TRUSTEE / SINGLE_TRUSTEE.
 */
public enum TrustType {
    SINGLE_TRUSTEE,
    MULTI_TRUSTEE,
    ENDOWMENT,
    DEVASWOM,
    OTHER,
    /** @deprecated Legacy value — use MULTI_TRUSTEE. Kept for DB backward compatibility. */
    @Deprecated PUBLIC,
    /** @deprecated Legacy value — use SINGLE_TRUSTEE. Kept for DB backward compatibility. */
    @Deprecated PRIVATE
}
