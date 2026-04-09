package com.templeregistry.entity.temple;

/**
 * Operational status of a Temple.
 * SUSPENDED: all TA-initiated writes are blocked; DC cannot act on declarations.
 * Only SUPER_ADMIN can suspend or reactivate a temple.
 */
public enum TempleStatus { ACTIVE, SUSPENDED }
