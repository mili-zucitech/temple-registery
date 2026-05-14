package com.templeregistry.service.governance;

import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import org.springframework.stereotype.Service;

/**
 * Centralised governance-visibility policy.
 *
 * <p>Determines whether a caller is permitted to see internal governance
 * metadata (workflow status, rejection reasons, pending/overdue counts,
 * oversight badges) for a given temple.
 *
 * <h3>Rules</h3>
 * <ul>
 *   <li>DISTRICT_COLLECTOR, SUPER_ADMIN, DC_STAFF, AUDITOR, VIEWER: always yes.</li>
 *   <li>TEMPLE_AUTHORITY viewing their <em>own</em> temple: yes — TA must be able
 *       to track their own submissions and see rejection reasons.</li>
 *   <li>TEMPLE_AUTHORITY viewing <em>another</em> temple: no — governance metadata
 *       (approval badges, rejection reasons, workflow state, overdue counts, etc.)
 *       must not be visible to TAs for temples they do not manage.</li>
 * </ul>
 *
 * <p>This class is the single authoritative place for this check.
 * Do NOT scatter {@code if (isTA && !isOwner)} guards across service methods.
 */
@Service
public class TempleVisibilityPolicy {

    /**
     * Returns {@code true} when the caller represented by {@code claims} is
     * allowed to see governance/oversight metadata for the temple identified
     * by {@code templeId}.
     *
     * @param claims   JWT claims of the authenticated caller.
     * @param templeId the temple whose governance visibility is being queried.
     * @return {@code true} if governance fields should be included in the response.
     */
    public boolean canViewGovernance(ScopeHelper.Claims claims, Long templeId) {
        if (!RoleConstants.TEMPLE_AUTHORITY.equals(claims.role())) {
            // DC, SA, DC_STAFF, AUDITOR, VIEWER — all see governance data.
            return true;
        }
        // TEMPLE_AUTHORITY: only own temple.
        Long callerTempleId = claims.templeId();
        return callerTempleId != null && callerTempleId.equals(templeId);
    }
}
