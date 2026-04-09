package com.templeregistry.service.dc;

import com.templeregistry.dto.request.export.ExportDeclarationsRequest;
import com.templeregistry.dto.request.export.ExportTemplesRequest;
import com.templeregistry.dto.response.dc.ExportJobResponse;
import com.templeregistry.security.ScopeHelper;

public interface DcExportService {

    /**
     * Export district-scoped temple list (CSV or PDF).
     * < 500 rows: synchronous — generates file and returns SYNC_COMPLETE with downloadUrl.
     * >= 500 rows: asynchronous — returns 202 ASYNC_ACCEPTED; DC is notified via inbox on completion.
     *
     * Rate-limited: max 5 requests per user per 10-minute window.
     * Idempotent: Idempotency-Key header deduplicated for 5 minutes.
     *
     * dc_e2e Sections 6.10, 2.9.
     */
    ExportJobResponse exportTemples(ExportTemplesRequest request, String idempotencyKey, ScopeHelper.Claims claims);

    /**
     * Export district-scoped declaration list (CSV or PDF).
     * Same sync/async, rate-limiting, and idempotency rules as exportTemples.
     * dc_e2e Sections 6.10, 2.9.
     */
    ExportJobResponse exportDeclarations(ExportDeclarationsRequest request, String idempotencyKey, ScopeHelper.Claims claims);
}
