package com.templeregistry.dto.response.dc;

import lombok.Builder;
import lombok.Getter;

/**
 * Result of an export job submission.
 *
 * SYNC (< 500 rows): status = "SYNC_COMPLETE", downloadUrl populated.
 * ASYNC (>= 500 rows): HTTP 202, status = "ASYNC_ACCEPTED", downloadUrl null.
 *   The DC retrieves the download URL from their in-app notification inbox
 *   once the async job completes.
 *
 * dc_e2e Section 2.9.
 */
@Getter
@Builder
public class ExportJobResponse {

    private String jobId;

    /** "CSV" or "PDF". */
    private String format;

    /** "SYNC_COMPLETE" | "ASYNC_ACCEPTED". */
    private String status;

    /** Populated for SYNC_COMPLETE. Null for ASYNC_ACCEPTED. */
    private String downloadUrl;

    /** Row count scoped to the filter. */
    private int recordCount;
}
