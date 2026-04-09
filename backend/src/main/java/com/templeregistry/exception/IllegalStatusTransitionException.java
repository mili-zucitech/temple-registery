package com.templeregistry.exception;

public class IllegalStatusTransitionException extends RuntimeException {

    public IllegalStatusTransitionException(String from, String to) {
        super("Status transition from [" + from + "] to [" + to + "] is not permitted.");
    }

    public IllegalStatusTransitionException(String message) {
        super(message);
    }
}
