package com.templeregistry.exception;

/**
 * Raised when an operation attempts to mutate an immutable business record.
 * Example: removing a document attached to an APPROVED declaration.
 */
public class ImmutableResourceException extends RuntimeException {
    public ImmutableResourceException(String message) {
        super(message);
    }
}

