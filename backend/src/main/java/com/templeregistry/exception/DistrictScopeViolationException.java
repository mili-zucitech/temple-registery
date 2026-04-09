package com.templeregistry.exception;

/**
 * Thrown when a principal attempts to access a resource that belongs to a district
 * other than their JWT-assigned district.
 *
 * Per dc_e2e Section 2.4 (R7): this exception ALWAYS maps to HTTP 404 with a fixed,
 * non-informative body. Returning 403 would reveal that the resource exists in another
 * district. The HTTP 404 body is byte-for-byte identical to EntityNotFoundException so
 * that timing analysis cannot distinguish "not found" from "out of district".
 */
public class DistrictScopeViolationException extends RuntimeException {

    public DistrictScopeViolationException() {
        super("The requested resource was not found.");
    }

    public DistrictScopeViolationException(String message) {
        super(message);
    }
}
