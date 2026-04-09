package com.templeregistry.exception;

/**
 * Thrown by AcknowledgementNumberGenerator when LAST_INSERT_ID() returns 0
 * after an INSERT into acknowledgement_sequences.
 *
 * A zero seq_id means the INSERT silently failed or the MySQL session was reset.
 * This always maps to HTTP 500 — the acknowledgement transaction must be aborted.
 * Never produce acknowledgement number TRM/ACK/…/000000.
 *
 * dc_e2e Section 2.7 (S2 — seq_id zero guard).
 */
public class AcknowledgementNumberConflictException extends RuntimeException {

    public AcknowledgementNumberConflictException(String financialYear) {
        super("Acknowledgement sequence returned seq_id=0 for financial year ["
                + financialYear + "]. INSERT may have silently failed.");
    }
}
