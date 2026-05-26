package com.templeregistry.entity.notice;

public enum NoticeStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED,
    EXPIRED;

    /** EXPIRED is a terminal state — no further transitions allowed. */
    public boolean isTerminal() {
        return this == EXPIRED;
    }
}
