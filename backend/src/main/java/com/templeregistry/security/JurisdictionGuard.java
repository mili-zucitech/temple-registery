package com.templeregistry.security;

import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.geo.Taluk;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.DistrictScopeViolationException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.JurisdictionAccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Enforces district-level jurisdiction scoping for DC and DC_STAFF roles.
 * Call assertSameDistrict() before returning any resource.
 */
@Component
public class JurisdictionGuard {

    public void assertSameDistrict(Long resourceDistrictId) {
        ScopeHelper.Claims claims = currentClaimsOrNull();
        if (claims == null) return; // anonymous: no district restriction (public read endpoint)
        String role = claims.role();
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
            if (!resourceDistrictId.equals(claims.districtId())) {
                throw new JurisdictionAccessDeniedException(
                        "Resource district [" + resourceDistrictId + "] does not match your assigned district ["
                                + claims.districtId() + "].");
            }
        }
        // SUPER_ADMIN, AUDITOR, and VIEWER are not jurisdiction-scoped
    }

    public Long enforceDistrictId(Long requestedDistrictId) {
        ScopeHelper.Claims claims = currentClaimsOrNull();
        if (claims == null) return requestedDistrictId; // anonymous: no district restriction
        String role = claims.role();
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role) || RoleConstants.DC_STAFF.equals(role)) {
            return claims.districtId(); // JWT claim always wins for DC roles
        }
        return requestedDistrictId; // SUPER_ADMIN, AUDITOR, VIEWER may provide or omit
    }

    /**
     * Returns the current principal's Claims if the request is authenticated with a valid JWT,
     * or null if the request is anonymous (principal is String "anonymousUser").
     * Used for endpoints that are accessible to both authenticated and anonymous users.
     */
    private ScopeHelper.Claims currentClaimsOrNull() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        return (principal instanceof ScopeHelper.Claims c) ? c : null;
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c;
        throw new IllegalStateException("Authenticated principal is not a ScopeHelper.Claims instance.");
    }

    /**
     * DC module district scope assertion — always throws HTTP 404, never 403.
     *
     * Traverses temple → hobli → taluk → district with a full null-guard chain.
     * If any hop is null (incomplete geo seed data), throws EntityNotFoundException
     * so the error is surfaced as a data integrity alert, not an uncaught NPE.
     *
     * For SUPER_ADMIN principals: returns immediately without any restriction.
     * For TEMPLE_AUTHORITY principals: returns immediately (ownership is checked separately).
     * For DISTRICT_COLLECTOR and DC_STAFF: if districtId is null, throws
     * IllegalStateException (corrupted JWT per R4 — never a valid bypass).
     *
     * dc_e2e Sections 2.4 (R4, R6, R7), 2.5 (P0-4).
     *
     * @param temple  fully-loaded Temple entity (hobli association must be eager-loaded)
     * @param claims  ScopeHelper.Claims from the current request's SecurityContext
     */
    public void assertDistrictScope(Temple temple, ScopeHelper.Claims claims) {
        String role = claims.role();

        // SUPER_ADMIN, TEMPLE_AUTHORITY, and VIEWER are never jurisdiction-scoped.
        // TEMPLE_AUTHORITY ownership is checked separately via OwnershipGuard.
        // VIEWER has statewide read-only access, bypassing district scoping.
        if (RoleConstants.SUPER_ADMIN.equals(role)
                || RoleConstants.TEMPLE_AUTHORITY.equals(role)
                || RoleConstants.VIEWER.equals(role)) {
            return;
        }

        // R4 — null districtId on non-SA/non-TA is always a programming error or corrupted JWT
        Long principalDistrictId = claims.districtId();
        if (principalDistrictId == null) {
            throw new IllegalStateException(
                    "Non-SUPER_ADMIN principal [role=" + role + "] has null districtId — corrupted JWT or missing claim.");
        }

        // P0-4 — Three-hop null-guard traversal: temple → hobli → taluk → district
        Hobli hobli = temple.getHobli();
        if (hobli == null) {
            throw new EntityNotFoundException(
                    "Temple geo data is incomplete: hobli reference is missing for templeId=" + temple.getId(),
                    "GEO_INCOMPLETE");
        }

        Taluk taluk = hobli.getTaluk();
        if (taluk == null) {
            throw new EntityNotFoundException(
                    "Temple geo data is incomplete: taluk reference is missing for hobliId=" + hobli.getId(),
                    "GEO_INCOMPLETE");
        }

        District district = taluk.getDistrict();
        if (district == null) {
            throw new EntityNotFoundException(
                    "Temple geo data is incomplete: district reference is missing for talukId=" + taluk.getId(),
                    "GEO_INCOMPLETE");
        }

        Long templeDistrictId = district.getId();
        if (templeDistrictId == null) {
            throw new EntityNotFoundException(
                    "Temple geo data is incomplete: district id is null for talukId=" + taluk.getId(),
                    "GEO_INCOMPLETE");
        }

        // R7 — mismatch → HTTP 404 (never 403) to prevent district existence leakage
        if (!principalDistrictId.equals(templeDistrictId)) {
            throw new DistrictScopeViolationException();
        }
    }
}
