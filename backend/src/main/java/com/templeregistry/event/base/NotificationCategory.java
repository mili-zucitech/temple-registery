package com.templeregistry.event.base;

/**
 * Notification categories for filtering and grouping in the UI.
 */
public enum NotificationCategory {
    SUBMISSION,      // Entity submitted for review
    APPROVAL,        // Entity approved
    REJECTION,       // Entity rejected
    CLARIFICATION,   // Clarification requested or responded
    SITE_VISIT,      // Site visit scheduled/completed
    REMINDER,        // Deadline reminders
    OVERDUE,         // Overdue alerts
    DOCUMENT,        // Document-related notifications
    SYSTEM           // System-generated notifications
}
