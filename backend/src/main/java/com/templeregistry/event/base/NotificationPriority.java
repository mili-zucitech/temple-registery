package com.templeregistry.event.base;

/**
 * Notification priority levels for UI rendering and email urgency.
 */
public enum NotificationPriority {
    LOW,      // Informational updates
    MEDIUM,   // Standard workflow notifications
    HIGH,     // Requires attention
    CRITICAL  // Urgent action required (overdue, rejection, etc.)
}
