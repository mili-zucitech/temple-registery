package com.templeregistry.entity.governance;

/**
 * Physical verification status for Asset Declarations ONLY.
 *
 * DC-ONLY field — must NEVER be exposed to Temple Authority in any API response.
 * Manually set by DC only. System must NEVER auto-set this.
 *
 * Rules:
 * - Default: NOT_INITIATED
 * - DC can order physical verification at any time (→ ORDERED_FOR_PHYSICAL_VERIFICATION)
 * - DC can mark as PHYSICALLY_VERIFIED or VERIFICATION_FAILED
 * - DC MUST NOT approve a declaration if status = VERIFICATION_FAILED
 * - DC CAN approve if status = NOT_INITIATED (physical verification is optional)
 * - Any TA edit after PHYSICALLY_VERIFIED or VERIFICATION_FAILED resets to NOT_INITIATED
 */
public enum PhysicalVerificationStatus {
    NOT_INITIATED,
    ORDERED_FOR_PHYSICAL_VERIFICATION,
    PHYSICALLY_VERIFIED,
    VERIFICATION_FAILED
}
