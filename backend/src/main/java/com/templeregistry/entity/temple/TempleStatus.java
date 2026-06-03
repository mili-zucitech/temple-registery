package com.templeregistry.entity.temple;

/**
 * Operational status of a Temple.
 * SUSPENDED: all TA-initiated writes are blocked; DC cannot act on declarations.
 * FROZEN: blocks new declarations and submissions while under review.
 * ARCHIVED: terminal status — temple is closed and no further action allowed.
 * Only SUPER_ADMIN can change status beyond ACTIVE.
 */
public enum TempleStatus { ACTIVE, SUSPENDED, FROZEN, ARCHIVED }
