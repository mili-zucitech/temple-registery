package com.templeregistry.exception;

public class EntityNotFoundException extends RuntimeException {

    private final String errorCode;

    public EntityNotFoundException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public EntityNotFoundException(String entityName, Long id) {
        super(entityName + " not found with id: " + id);
        this.errorCode = entityName.toUpperCase().replace(" ", "_") + "_NOT_FOUND";
    }

    public String getErrorCode() {
        return errorCode;
    }
}
