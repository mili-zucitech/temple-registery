package com.templeregistry.service.ta;

import com.templeregistry.dto.request.ta.TaDocumentMetadataRequest;
import com.templeregistry.dto.request.ta.TaProfileStagingRequest;
import com.templeregistry.dto.response.ta.TaActivityResponse;
import com.templeregistry.dto.response.ta.TaCurrentProfileResponse;
import com.templeregistry.dto.response.ta.TaDashboardResponse;
import com.templeregistry.dto.response.ta.TaDocumentResponse;
import com.templeregistry.dto.response.ta.TaProfileStatusResponse;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.security.ScopeHelper;

public interface TaDashboardService {

    /** Aggregated dashboard card: temple info + profile status + pending actions. */
    TaDashboardResponse getDashboard(ScopeHelper.Claims claims);

    /** Temple master record scoped to the logged-in TA's temple. */
    TempleResponse getTemple(ScopeHelper.Claims claims);

    /** Currently-approved published profile (temple_profile_current). Null if not yet approved. */
    TaCurrentProfileResponse getCurrentProfile(ScopeHelper.Claims claims);

    /**
     * Active staging profile: DRAFT or PENDING_REVIEW (shown as SUBMITTED).
     * Returns null if no active staging exists.
     */
    TempleProfileStagingResponse getActiveStagingProfile(ScopeHelper.Claims claims);

    /**
     * Create a new DRAFT or patch an existing one.
     * Delegates to TempleProfileStagingService; throws if status is PENDING_REVIEW (EC-04).
     */
    TempleProfileStagingResponse createOrUpdateStagingProfile(ScopeHelper.Claims claims,
                                                               TaProfileStagingRequest request);

    /** Transition DRAFT → PENDING_REVIEW (displayed as SUBMITTED). Notifies DC. */
    TempleProfileStagingResponse submitProfile(ScopeHelper.Claims claims);

    /** Lightweight status for the status-badge widget. */
    TaProfileStatusResponse getProfileStatus(ScopeHelper.Claims claims);

    /**
     * Register a document already uploaded by the TA directly to S3.
     * Server-side validates MIME and file size.
     */
    TaDocumentResponse registerDocument(ScopeHelper.Claims claims, TaDocumentMetadataRequest request);

    /** Audit/activity summary derived from staging history timestamps. */
    TaActivityResponse getActivitySummary(ScopeHelper.Claims claims);
}
