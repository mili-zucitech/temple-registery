package com.templeregistry.exception;

import com.templeregistry.entity.declaration.DeclarationStatus;

public class InvalidStateTransitionException extends RuntimeException {
    private final DeclarationStatus fromStatus;
    private final DeclarationStatus toStatus;

    public InvalidStateTransitionException(DeclarationStatus from, DeclarationStatus to) {
        super("Transition " + from.name() + "->" + to.name() + " is not permitted.");
        this.fromStatus = from;
        this.toStatus = to;
    }

    public DeclarationStatus getFromStatus() { return fromStatus; }
    public DeclarationStatus getToStatus() { return toStatus; }
}
