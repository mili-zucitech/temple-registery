package com.templeregistry.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown by the WorkflowEngine when a transition is invalid.
 * Maps to HTTP 422 Unprocessable Entity.
 */
@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
public class WorkflowException extends RuntimeException {
    public WorkflowException(String message) {
        super(message);
    }
    public WorkflowException(String message, Throwable cause) {
        super(message, cause);
    }
}
