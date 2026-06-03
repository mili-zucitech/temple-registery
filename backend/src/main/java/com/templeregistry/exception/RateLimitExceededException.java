package com.templeregistry.exception;

/**
 * Thrown when a user exceeds the allowed request rate for a rate-limited endpoint.
 *
 * Maps to HTTP 429 Too Many Requests with a Retry-After header indicating
 * the number of seconds until the current window resets.
 *
 * Export endpoints: 5 requests per 10-minute window per authenticated user.
 * dc_e2e Section 2.9 (R10 — Export rate limit, rate_request_log table).
 */
public class RateLimitExceededException extends RuntimeException {

    private final int retryAfterSeconds;

    public RateLimitExceededException(int retryAfterSeconds) {
        super("Rate limit exceeded. You may retry after " + retryAfterSeconds + " seconds.");
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
