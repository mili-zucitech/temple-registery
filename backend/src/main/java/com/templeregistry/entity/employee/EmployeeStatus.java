package com.templeregistry.entity.employee;

/**
 * Employee lifecycle statuses.
 * RETIRED and RESIGNED are terminal — no transition back to ACTIVE is permitted (VAL-012).
 * date_of_leaving is mandatory when transitioning to either terminal state (VAL-015).
 */
public enum EmployeeStatus { ACTIVE, ON_LEAVE, RETIRED, RESIGNED }
