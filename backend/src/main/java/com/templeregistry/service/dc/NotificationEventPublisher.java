package com.templeregistry.service.dc;

/**
 * Synchronous notification event publisher for DC module workflow actions.
 *
 * IMPORTANT: This is NOT the async NotificationService. Methods on this interface
 * insert a notification_events row within the SAME database transaction as the
 * calling workflow action. If the workflow transaction rolls back, the notification
 * row rolls back with it — ensuring zero silent notification loss.
 *
 * The Notification Dispatch Service (separate poller, out of DC module scope)
 * picks up rows with status=PENDING and creates in_app_notifications entries.
 *
 * dc_e2e Section 2.8 — ON-PREM: all channels = ["IN_APP"].
 */
public interface NotificationEventPublisher {

    /**
     * Publish a notification event for a DC workflow action.
     *
     * @param recipientId   target user's database id
     * @param eventType     template key (e.g. "DECLARATION_APPROVED")
     * @param referenceId   entity id the event relates to (e.g. declaration id)
     * @param referenceType entity type label (e.g. "ASSET_DECLARATION")
     */
    void publish(Long recipientId, String eventType, Long referenceId, String referenceType);
}
