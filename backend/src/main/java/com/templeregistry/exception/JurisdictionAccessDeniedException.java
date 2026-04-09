package com.templeregistry.exception;

public class JurisdictionAccessDeniedException extends RuntimeException {

    public JurisdictionAccessDeniedException() {
        super("Access denied: resource is outside your assigned jurisdiction.");
    }

    public JurisdictionAccessDeniedException(String message) {
        super(message);
    }
}
