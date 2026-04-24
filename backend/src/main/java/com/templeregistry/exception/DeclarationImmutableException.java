package com.templeregistry.exception;

public class DeclarationImmutableException extends RuntimeException {
    public DeclarationImmutableException(Long declarationId) {
        super("Declaration " + declarationId + " is not editable. Only DRAFT declarations can be modified.");
    }
}
