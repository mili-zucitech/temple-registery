package com.templeregistry.exception;

public class AccountLockedException extends RuntimeException {

    private final long retryAfterEpochSeconds;

    public AccountLockedException(long retryAfterEpochSeconds) {
        super("Account is locked due to too many failed login attempts.");
        this.retryAfterEpochSeconds = retryAfterEpochSeconds;
    }

    public long getRetryAfterEpochSeconds() {
        return retryAfterEpochSeconds;
    }
}
