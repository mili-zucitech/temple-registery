package com.templeregistry.exception;

/**
 * Raised when DC attempts to request more clarification rounds than permitted.
 * Mapped to HTTP 422 to indicate a workflow/business-rule violation.
 */
public class ClarificationLimitExceededException extends RuntimeException {
    public ClarificationLimitExceededException(String message) {
        super(message);
    }
}

