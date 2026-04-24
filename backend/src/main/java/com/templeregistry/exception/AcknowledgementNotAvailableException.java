package com.templeregistry.exception;

public class AcknowledgementNotAvailableException extends RuntimeException {
    public AcknowledgementNotAvailableException(Long declarationId) {
        super("Acknowledgement is not available for declaration " + declarationId +
              ". Only APPROVED declarations have an acknowledgement number.");
    }
}
