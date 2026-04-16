package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

/**
 * Current authenticated user context for the DC portal frontend.
 *
 * Provided by GET /api/v1/dc/me so the frontend knows the principal's
 * district scope and role for RBAC-based rendering (e.g. hide approve
 * button for DC_STAFF, show all-districts option for SUPER_ADMIN).
 * dc_e2e Section 1.2 — Current User Context.
 */
@Getter
@Builder
public class DcContextResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String role;
    private boolean aadhaarVerified;

    /** Null for SUPER_ADMIN (no district restriction). */
    private Long districtId;

    /** Resolved name of the district. Null for SUPER_ADMIN. */
    private String districtName;

    /** City (revenue division) that the district belongs to. Null for SUPER_ADMIN. */
    private Long cityId;
}
