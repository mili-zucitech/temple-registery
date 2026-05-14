package com.templeregistry.controller;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.timeline.TempleTimelineEventResponse;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.timeline.TempleTimelineService;
import com.templeregistry.security.OwnershipGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only timeline API for temple activity/audit trail.
 *
 * Access control:
 *   - TEMPLE_AUTHORITY : own temple only (enforced via OwnershipGuard)
 *   - DC / DC_STAFF    : temples in their district (enforced via service-layer jurisdiction check)
 *   - SUPER_ADMIN      : full access
 *   - AUDITOR / VIEWER : read-only full access
 *
 * This controller contains ZERO business logic — it delegates entirely to TempleTimelineService.
 */
@RestController
@RequestMapping("/api/v1/timeline")
@RequiredArgsConstructor
public class TempleTimelineController {

    private static final int DEFAULT_SIZE = 20;
    private static final int MAX_SIZE     = 50;

    private final TempleTimelineService templeTimelineService;
    private final OwnershipGuard ownershipGuard;

    /**
     * GET /api/v1/timeline/temples/{templeId}?page=0&size=20
     *
     * Returns the paginated activity timeline for a temple, sorted latest first.
     * Page size is clamped to 50 server-side regardless of client request.
     */
    @GetMapping("/temples/{templeId}")
    @PreAuthorize(RoleConstants.CAN_READ_TEMPLES)
    public ResponseEntity<ApiResponse<PaginatedResponse<TempleTimelineEventResponse>>> getTempleTimeline(
        @PathVariable Long templeId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        // TEMPLE_AUTHORITY must own this temple
        ownershipGuard.assertOwnsTemple(templeId);

        int clampedSize = Math.min(size <= 0 ? DEFAULT_SIZE : size, MAX_SIZE);
        PaginatedResponse<TempleTimelineEventResponse> result =
            templeTimelineService.getTimeline(templeId, PageRequest.of(page, clampedSize));

        return ResponseEntity.ok(ApiResponse.success("Temple timeline retrieved.", result));
    }
}
