package com.templeregistry.exception;

/**
 * Thrown when the export executor queue is at capacity and the AbortPolicy
 * rejects the submitted task.
 *
 * Maps to HTTP 503 Service Unavailable with a Retry-After header.
 * The client must wait before retrying the export request.
 *
 * dc_e2e Section 2.9 (S10 — exportExecutor AbortPolicy).
 */
public class ExportQueueFullException extends RuntimeException {

    private final int retryAfterSeconds;

    public ExportQueueFullException() {
        super("Export service is at capacity. Please retry after a short delay.");
        this.retryAfterSeconds = 30;
    }

    public ExportQueueFullException(int retryAfterSeconds) {
        super("Export service is at capacity. Please retry after " + retryAfterSeconds + " seconds.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
