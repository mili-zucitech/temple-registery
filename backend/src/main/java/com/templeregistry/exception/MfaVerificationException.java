package com.templeregistry.exception;

public class MfaVerificationException extends RuntimeException {

    public MfaVerificationException(String message) {
        super(message);
    }
}
