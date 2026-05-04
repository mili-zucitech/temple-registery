package com.templeregistry.service.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;

/**
 * Manages the temple profile staging workflow for Temple Authority users.
 * Phase 3 of the TA workflow spec: TA creates a DRAFT, submits for DC review,
 * DC approves or rejects. All TA profile edits go through this staging layer.
 */
public interface TempleProfileStagingService {

    /**
     * Create a new DRAFT staging record or update the existing DRAFT.
     * Throws IllegalStateException if a PENDING_REVIEW record already exists (EC-04).
     */
    TempleProfileStagingResponse createOrUpdateDraft(Long templeId, CreateTempleProfileStagingRequest request);

    /**
     * Transition the current DRAFT to PENDING_REVIEW and notify DC.
     * Throws IllegalStateException if no DRAFT exists or temple is SUSPENDED (EC-03).
     */
    TempleProfileStagingResponse submitForReview(Long templeId);

    /**
     * Approve a PENDING_REVIEW staging record (DC/SA only).
     * Promotes staging fields to the Temple entity; marks any previous APPROVED record SUPERSEDED.
     * Fires notification event #4.
     */
    TempleProfileStagingResponse approve(Long templeId, Long stagingId);

    /**
     * Reject a PENDING_REVIEW staging record (DC/SA only).
     * Sets status to REJECTED with dc comment; fires notification event #5.
     */
    TempleProfileStagingResponse reject(Long templeId, Long stagingId, String dcComment);

    /** Returns the active (DRAFT or PENDING_REVIEW) staging record, or null if none exists. */
    TempleProfileStagingResponse getActiveStagingOrNull(Long templeId);

    /** Paginated history of all staging records for a temple, most recent first. */
    PaginatedResponse<TempleProfileStagingResponse> getHistory(Long templeId, int page, int size);

    /** [P5] Get a specific staging record by ID. */
    TempleProfileStagingResponse getById(Long id);

    /** [P6] DC requests clarification for a profile update. */
    void requestClarification(Long templeId, Long stagingId, String message, Long requestedByUserId);

    /** [P6] TA responds to a clarification request. */
    void respondToClarification(Long templeId, Long threadId, String response, Long respondedByUserId);
}
