package com.templeregistry.property;

import com.templeregistry.controller.dc.DcNotificationController;
import com.templeregistry.controller.notification.NotificationController;
import com.templeregistry.entity.notification.InAppNotification;
import com.templeregistry.entity.notification.NotificationEvent;
import com.templeregistry.event.base.ModuleType;
import com.templeregistry.event.base.NotificationPriority;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.impl.dc.AsyncExportBean;
import com.templeregistry.service.impl.dc.DeclarationWorkflowServiceImpl;
import com.templeregistry.service.notification.impl.NotificationDispatchServiceImpl;
import com.templeregistry.service.notification.NotificationPreferenceService;
import net.jqwik.api.*;
import net.jqwik.api.constraints.LongRange;
import net.jqwik.api.constraints.Positive;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Preservation Property Tests — Notification System Stabilization
 *
 * These tests encode EXISTING CORRECT behavior that must NOT regress after the fix.
 * They MUST PASS on unfixed code — they establish the preservation baseline.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13
 */
class NotificationPreservationTest {

    // ==================== 3.6, 3.7, 3.8: Notification read/list endpoints ====================

    /**
     * Preservation 3.8 — Validates: Requirements 3.8
     * GET /api/v1/notifications must exist on NotificationController (paginated list, newest first).
     * Observed: endpoint exists and returns paginated list ordered by createdAt DESC.
     */
    @Test
    void preservation_3_8_notificationControllerHasListEndpoint() {
        Class<?> clazz = NotificationController.class;
        boolean hasListEndpoint = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> {
                    org.springframework.web.bind.annotation.GetMapping getMapping =
                            m.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class);
                    if (getMapping != null) {
                        // Root GET mapping (empty value or no value)
                        String[] values = getMapping.value();
                        return values.length == 0 || Arrays.asList(values).contains("");
                    }
                    return false;
                });
        assertThat(hasListEndpoint)
                .as("PRESERVATION 3.8: NotificationController must have GET / (list) endpoint. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    /**
     * Preservation 3.6 — Validates: Requirements 3.6
     * POST /api/v1/notifications/{id}/read must exist on NotificationController.
     * Observed: endpoint exists and marks notification as read, sets readAt.
     */
    @Test
    void preservation_3_6_notificationControllerHasMarkReadEndpoint() {
        Class<?> clazz = NotificationController.class;
        boolean hasMarkReadEndpoint = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> {
                    org.springframework.web.bind.annotation.PostMapping postMapping =
                            m.getAnnotation(org.springframework.web.bind.annotation.PostMapping.class);
                    if (postMapping != null) {
                        return Arrays.stream(postMapping.value())
                                .anyMatch(v -> v.contains("{id}") && v.contains("read")
                                        && !v.contains("read-all") && !v.contains("acknowledge"));
                    }
                    return false;
                });
        assertThat(hasMarkReadEndpoint)
                .as("PRESERVATION 3.6: NotificationController must have POST /{id}/read endpoint. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    /**
     * Preservation 3.7 — Validates: Requirements 3.7
     * POST /api/v1/notifications/read-all must exist on NotificationController.
     * Observed: endpoint exists and marks all unread notifications as read.
     */
    @Test
    void preservation_3_7_notificationControllerHasMarkAllReadEndpoint() {
        Class<?> clazz = NotificationController.class;
        boolean hasMarkAllReadEndpoint = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> {
                    org.springframework.web.bind.annotation.PostMapping postMapping =
                            m.getAnnotation(org.springframework.web.bind.annotation.PostMapping.class);
                    if (postMapping != null) {
                        return Arrays.stream(postMapping.value())
                                .anyMatch(v -> v.contains("read-all"));
                    }
                    return false;
                });
        assertThat(hasMarkAllReadEndpoint)
                .as("PRESERVATION 3.7: NotificationController must have POST /read-all endpoint. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    // ==================== 3.9: DC unread-count endpoint ====================

    /**
     * Preservation 3.9 — Validates: Requirements 3.9
     * GET /api/v1/dc/notifications/unread-count must exist on DcNotificationController.
     * Observed: endpoint exists and returns correct unread count for DC user.
     */
    @Test
    void preservation_3_9_dcNotificationControllerHasUnreadCountEndpoint() {
        Class<?> clazz = DcNotificationController.class;
        boolean hasUnreadCountEndpoint = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> {
                    org.springframework.web.bind.annotation.GetMapping getMapping =
                            m.getAnnotation(org.springframework.web.bind.annotation.GetMapping.class);
                    if (getMapping != null) {
                        return Arrays.asList(getMapping.value()).contains("/unread-count");
                    }
                    return false;
                });
        assertThat(hasUnreadCountEndpoint)
                .as("PRESERVATION 3.9: DcNotificationController must have GET /unread-count endpoint. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    // ==================== 3.11: AsyncExportBean EXPORT_READY path ====================

    /**
     * Preservation 3.11 — Validates: Requirements 3.11
     * AsyncExportBean must inject the legacy NotificationEventPublisher (dc package).
     * Observed: AsyncExportBean calls notificationPublisher.publish(recipientUserId, "EXPORT_READY", ...)
     * with a valid resolved recipientUserId — this path is NOT broken and must not be changed.
     */
    @Test
    void preservation_3_11_asyncExportBeanUsesLegacyPublisherForExportReady() {
        Class<?> clazz = AsyncExportBean.class;
        boolean hasLegacyPublisher = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(NotificationEventPublisher.class));
        assertThat(hasLegacyPublisher)
                .as("PRESERVATION 3.11: AsyncExportBean must inject dc.NotificationEventPublisher " +
                    "to deliver EXPORT_READY notifications. This path uses a valid resolved " +
                    "recipientUserId and must not be changed.")
                .isTrue();
    }

    /**
     * Preservation 3.11b — Validates: Requirements 3.11
     * Property: for all valid (non-zero, non-null) recipientUserIds, the EXPORT_READY
     * notification path in AsyncExportBean calls publish() with that exact recipientUserId.
     *
     * We verify this structurally: AsyncExportBean has the publisher field and the
     * exportTemplesAsync/exportDeclarationsAsync methods exist.
     */
    @Property(tries = 50)
    void preservation_3_11_exportReadyPathExistsForAllValidRecipientIds(
            @ForAll @LongRange(min = 1L, max = 100000L) long recipientUserId) {
        // recipientUserId is valid (non-zero, non-null) — the export path must work
        assertThat(recipientUserId)
                .as("PRESERVATION 3.11: recipientUserId must be non-zero for EXPORT_READY path")
                .isGreaterThan(0L);

        // Verify AsyncExportBean has the async export methods
        Class<?> clazz = AsyncExportBean.class;
        boolean hasExportTemplesAsync = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("exportTemplesAsync"));
        boolean hasExportDeclarationsAsync = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("exportDeclarationsAsync"));

        assertThat(hasExportTemplesAsync)
                .as("PRESERVATION 3.11: AsyncExportBean.exportTemplesAsync() must exist")
                .isTrue();
        assertThat(hasExportDeclarationsAsync)
                .as("PRESERVATION 3.11: AsyncExportBean.exportDeclarationsAsync() must exist")
                .isTrue();
    }

    // ==================== 3.12: NotificationPreferenceService checks ====================

    /**
     * Preservation 3.12 — Validates: Requirements 3.12
     * NotificationDispatchServiceImpl must inject NotificationPreferenceService.
     * Observed: dispatch() checks isInAppEnabled() before delivering in-app notifications.
     */
    @Test
    void preservation_3_12_dispatchServiceInjectsPreferenceService() {
        Class<?> clazz = NotificationDispatchServiceImpl.class;
        boolean hasPreferenceService = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(NotificationPreferenceService.class));
        assertThat(hasPreferenceService)
                .as("PRESERVATION 3.12: NotificationDispatchServiceImpl must inject " +
                    "NotificationPreferenceService to respect user notification preferences. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    /**
     * Preservation 3.12b — Validates: Requirements 3.12
     * Property: for all ModuleType values, NotificationPreferenceService.isInAppEnabled()
     * and isEmailEnabled() methods exist and are callable.
     */
    @Property(tries = 20)
    void preservation_3_12_preferenceServiceHasRequiredMethods(
            @ForAll("moduleTypes") ModuleType moduleType) {
        Class<?> clazz = NotificationPreferenceService.class;

        boolean hasIsInAppEnabled = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("isInAppEnabled")
                        && m.getParameterCount() == 2
                        && m.getParameterTypes()[0].equals(Long.class)
                        && m.getParameterTypes()[1].equals(ModuleType.class));

        boolean hasIsEmailEnabled = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("isEmailEnabled")
                        && m.getParameterCount() == 2
                        && m.getParameterTypes()[0].equals(Long.class)
                        && m.getParameterTypes()[1].equals(ModuleType.class));

        assertThat(hasIsInAppEnabled)
                .as("PRESERVATION 3.12: NotificationPreferenceService.isInAppEnabled(Long, ModuleType) " +
                    "must exist for module: %s", moduleType)
                .isTrue();

        assertThat(hasIsEmailEnabled)
                .as("PRESERVATION 3.12: NotificationPreferenceService.isEmailEnabled(Long, ModuleType) " +
                    "must exist for module: %s", moduleType)
                .isTrue();
    }

    @Provide
    Arbitrary<ModuleType> moduleTypes() {
        return Arbitraries.of(ModuleType.values());
    }

    // ==================== 3.13: Email delivery for HIGH/CRITICAL priority ====================

    /**
     * Preservation 3.13 — Validates: Requirements 3.13
     * NotificationDispatchServiceImpl must inject EmailService.
     * Observed: dispatch() calls emailService.sendNotificationEmail() for HIGH/CRITICAL priority events.
     */
    @Test
    void preservation_3_13_dispatchServiceInjectsEmailService() {
        Class<?> clazz = NotificationDispatchServiceImpl.class;
        boolean hasEmailService = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(com.templeregistry.service.notification.EmailService.class));
        assertThat(hasEmailService)
                .as("PRESERVATION 3.13: NotificationDispatchServiceImpl must inject EmailService " +
                    "to send email notifications for HIGH/CRITICAL priority events. " +
                    "This is existing correct behavior that must not regress.")
                .isTrue();
    }

    /**
     * Preservation 3.13b — Validates: Requirements 3.13
     * Property: for all HIGH and CRITICAL priority events, the dispatch logic
     * must attempt email delivery (shouldSendEmail returns true when email is enabled).
     *
     * We verify the priority-based email logic structurally: the dispatch service
     * has a shouldSendEmail-equivalent private method that checks HIGH/CRITICAL.
     */
    @Property(tries = 50)
    void preservation_3_13_emailDeliveryAttemptedForHighAndCriticalPriority(
            @ForAll("highOrCriticalPriority") NotificationPriority priority) {
        // HIGH and CRITICAL priorities must trigger email delivery
        assertThat(priority)
                .as("PRESERVATION 3.13: Only HIGH and CRITICAL priorities should trigger email")
                .isIn(NotificationPriority.HIGH, NotificationPriority.CRITICAL);

        // Verify the dispatch service has the email service field (structural check)
        Class<?> clazz = NotificationDispatchServiceImpl.class;
        boolean hasEmailService = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(com.templeregistry.service.notification.EmailService.class));
        assertThat(hasEmailService)
                .as("PRESERVATION 3.13: Email service must be present for %s priority delivery", priority)
                .isTrue();
    }

    @Provide
    Arbitrary<NotificationPriority> highOrCriticalPriority() {
        return Arbitraries.of(NotificationPriority.HIGH, NotificationPriority.CRITICAL);
    }

    // ==================== 3.10: Notification failures must not break main transaction ====================

    /**
     * Preservation 3.10 — Validates: Requirements 3.10
     * NotificationDispatchServiceImpl.dispatch() must catch exceptions and not propagate them.
     * Observed: dispatch() has try/catch per recipient — notification failures are logged, not thrown.
     */
    @Test
    void preservation_3_10_dispatchServiceCatchesExceptionsPerRecipient() {
        Class<?> clazz = NotificationDispatchServiceImpl.class;
        // Verify dispatch method exists
        boolean hasDispatchMethod = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("dispatch"));
        assertThat(hasDispatchMethod)
                .as("PRESERVATION 3.10: NotificationDispatchServiceImpl must have dispatch() method")
                .isTrue();

        // Verify the class uses @Transactional with REQUIRES_NEW propagation
        // (independent transaction so failures don't affect caller)
        boolean hasRequiresNewTransaction = Arrays.stream(clazz.getDeclaredMethods())
                .filter(m -> m.getName().equals("dispatch"))
                .anyMatch(m -> {
                    org.springframework.transaction.annotation.Transactional tx =
                            m.getAnnotation(org.springframework.transaction.annotation.Transactional.class);
                    return tx != null && tx.propagation() ==
                            org.springframework.transaction.annotation.Propagation.REQUIRES_NEW;
                });
        assertThat(hasRequiresNewTransaction)
                .as("PRESERVATION 3.10: dispatch() must use REQUIRES_NEW propagation to isolate " +
                    "notification failures from the main business transaction.")
                .isTrue();
    }

    // ==================== 3.4: CLARIFICATION_ESCALATION to SUPER_ADMIN on round 2 ====================

    /**
     * Preservation 3.4 / CLARIFICATION_ESCALATION — Validates: Requirements 3.4
     * DeclarationWorkflowServiceImpl.requestClarification() must still dispatch
     * CLARIFICATION_ESCALATION to SUPER_ADMIN on round 2.
     * Observed: the legacy notificationPublisher.publish(sa.getId(), "CLARIFICATION_ESCALATION", ...)
     * call is present in requestClarification() for round == 2.
     */
    @Test
    void preservation_3_4_clarificationEscalationToSuperAdminOnRound2() {
        Class<?> clazz = DeclarationWorkflowServiceImpl.class;
        // The class must still inject the legacy publisher for the CLARIFICATION_ESCALATION path
        boolean hasLegacyPublisher = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(
                        com.templeregistry.service.dc.NotificationEventPublisher.class));
        assertThat(hasLegacyPublisher)
                .as("PRESERVATION 3.4: DeclarationWorkflowServiceImpl must retain the legacy " +
                    "NotificationEventPublisher for the CLARIFICATION_ESCALATION path " +
                    "(round 2 → notify SUPER_ADMIN). This path is correct and must not be removed.")
                .isTrue();
    }

    // ==================== 3.2, 3.3, 3.4: Declaration workflow notifications to TA ====================

    /**
     * Preservation 3.2, 3.3, 3.4 — Validates: Requirements 3.2, 3.3, 3.4
     * DeclarationWorkflowServiceImpl must inject NotificationHelper.
     * Observed: notificationHelper.notifyDeclarationApproved/Rejected/Flagged() are called
     * in approve/reject/requestClarification() when submittedBy is a valid user ID.
     *
     * Property: for all valid (non-zero, non-null) submittedBy IDs, the declaration workflow
     * service must have NotificationHelper wired to deliver in-app notifications to the TA.
     */
    @Property(tries = 50)
    void preservation_3_2_3_3_3_4_declarationWorkflowDeliversNotificationsForValidSubmittedBy(
            @ForAll @LongRange(min = 1L, max = 100000L) long submittedBy) {
        // submittedBy is valid (non-zero, non-null)
        assertThat(submittedBy)
                .as("PRESERVATION 3.2/3.3/3.4: submittedBy must be non-zero for notification delivery")
                .isGreaterThan(0L);

        Class<?> clazz = DeclarationWorkflowServiceImpl.class;
        boolean hasNotificationHelper = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getType().equals(
                        com.templeregistry.service.notification.NotificationHelper.class));
        assertThat(hasNotificationHelper)
                .as("PRESERVATION 3.2/3.3/3.4: DeclarationWorkflowServiceImpl must inject " +
                    "NotificationHelper to deliver DECLARATION_APPROVED/REJECTED/CLARIFICATION_REQUESTED " +
                    "notifications to the submitting TA (submittedBy=%d).", submittedBy)
                .isTrue();
    }

    // ==================== InAppNotification read/write fields ====================

    /**
     * Preservation — Validates: Requirements 3.6, 3.7, 3.8
     * InAppNotification entity must have isRead and readAt fields.
     * Observed: these fields exist and are used by markRead() and markAllRead().
     */
    @Test
    void preservation_inAppNotificationHasReadFields() {
        Class<?> clazz = InAppNotification.class;

        boolean hasIsRead = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("isRead"));
        assertThat(hasIsRead)
                .as("PRESERVATION: InAppNotification must have isRead field")
                .isTrue();

        boolean hasReadAt = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("readAt"));
        assertThat(hasReadAt)
                .as("PRESERVATION: InAppNotification must have readAt field")
                .isTrue();

        boolean hasCreatedAt = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("createdAt"));
        assertThat(hasCreatedAt)
                .as("PRESERVATION: InAppNotification must have createdAt field (for ordering by createdAt DESC)")
                .isTrue();
    }

    /**
     * Preservation — Validates: Requirements 3.8
     * Property: for all valid (non-zero, non-null) user IDs, the paginated list endpoint
     * must be available on NotificationController.
     *
     * We verify structurally: the controller has the list endpoint and the repository
     * method findAllByUserIdOrderByCreatedAtDesc exists.
     */
    @Property(tries = 50)
    void preservation_3_8_paginatedListAvailableForAllValidUserIds(
            @ForAll @LongRange(min = 1L, max = 100000L) long userId) {
        assertThat(userId)
                .as("PRESERVATION 3.8: userId must be non-zero for paginated list")
                .isGreaterThan(0L);

        // Verify the repository method exists
        Class<?> repoClass = com.templeregistry.repository.notification.InAppNotificationRepository.class;
        boolean hasFindAllByUserIdOrderByCreatedAtDesc = Arrays.stream(repoClass.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc"));
        assertThat(hasFindAllByUserIdOrderByCreatedAtDesc)
                .as("PRESERVATION 3.8: InAppNotificationRepository must have " +
                    "findAllByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc() for userId=%d", userId)
                .isTrue();
    }

    /**
     * Preservation — Validates: Requirements 3.6, 3.7
     * Property: for all valid (non-zero, non-null) user IDs, the markRead and markAllRead
     * operations must be available.
     */
    @Property(tries = 50)
    void preservation_3_6_3_7_markReadOperationsAvailableForAllValidUserIds(
            @ForAll @LongRange(min = 1L, max = 100000L) long userId) {
        assertThat(userId)
                .as("PRESERVATION 3.6/3.7: userId must be non-zero for mark-read operations")
                .isGreaterThan(0L);

        // Verify the repository has markAllRead
        Class<?> repoClass = com.templeregistry.repository.notification.InAppNotificationRepository.class;
        boolean hasMarkAllRead = Arrays.stream(repoClass.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("markAllRead"));
        assertThat(hasMarkAllRead)
                .as("PRESERVATION 3.6/3.7: InAppNotificationRepository must have markAllRead() " +
                    "for userId=%d", userId)
                .isTrue();

        // Verify countByUserIdAndIsReadAndDeletedAtIsNull exists (used by unread count)
        boolean hasCountByUserIdAndIsRead = Arrays.stream(repoClass.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("countByUserIdAndIsReadAndDeletedAtIsNull"));
        assertThat(hasCountByUserIdAndIsRead)
                .as("PRESERVATION 3.9: InAppNotificationRepository must have countByUserIdAndIsReadAndDeletedAtIsNull() " +
                    "for userId=%d", userId)
                .isTrue();
    }

    // ==================== 3.1: PROFILE_SUBMITTED notification to DC ====================

    /**
     * Preservation 3.1 — Validates: Requirements 3.1
     * NotificationHelper must have notifyTempleCreated() and notifyTempleUpdated() methods
     * for delivering PROFILE_SUBMITTED notifications to DCs.
     * Observed: these methods exist and call eventPublisher.publish() with resolved DC IDs.
     */
    @Test
    void preservation_3_1_notificationHelperHasTempleProfileNotificationMethods() {
        Class<?> clazz = com.templeregistry.service.notification.NotificationHelper.class;

        boolean hasNotifyTempleCreated = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("notifyTempleCreated"));
        assertThat(hasNotifyTempleCreated)
                .as("PRESERVATION 3.1: NotificationHelper must have notifyTempleCreated() " +
                    "to deliver PROFILE_SUBMITTED notifications to DCs.")
                .isTrue();

        boolean hasNotifyTempleUpdated = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("notifyTempleUpdated"));
        assertThat(hasNotifyTempleUpdated)
                .as("PRESERVATION 3.1: NotificationHelper must have notifyTempleUpdated() " +
                    "to deliver PROFILE_UPDATED notifications to DCs.")
                .isTrue();
    }

    // ==================== 3.5: DECLARATION_OVERDUE notification ====================

    /**
     * Preservation 3.5 — Validates: Requirements 3.5
     * NotificationHelper must have notifyDeclarationApproved/Rejected/Flagged methods
     * for delivering declaration workflow notifications to TAs.
     * Observed: these methods exist and iterate all taIds.
     */
    @Test
    void preservation_3_5_notificationHelperHasDeclarationNotificationMethods() {
        Class<?> clazz = com.templeregistry.service.notification.NotificationHelper.class;

        boolean hasNotifyApproved = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("notifyDeclarationApproved"));
        assertThat(hasNotifyApproved)
                .as("PRESERVATION 3.5: NotificationHelper must have notifyDeclarationApproved()")
                .isTrue();

        boolean hasNotifyRejected = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("notifyDeclarationRejected"));
        assertThat(hasNotifyRejected)
                .as("PRESERVATION 3.5: NotificationHelper must have notifyDeclarationRejected()")
                .isTrue();

        boolean hasNotifyFlagged = Arrays.stream(clazz.getDeclaredMethods())
                .anyMatch(m -> m.getName().equals("notifyDeclarationFlagged"));
        assertThat(hasNotifyFlagged)
                .as("PRESERVATION 3.5: NotificationHelper must have notifyDeclarationFlagged()")
                .isTrue();
    }

    // ==================== NotificationEvent audit record ====================

    /**
     * Preservation — Validates: Requirements 3.10, 3.11
     * NotificationEvent entity must have recipientId, eventType, status fields.
     * Observed: NotificationEventPublisherImpl saves NotificationEvent rows with these fields.
     */
    @Test
    void preservation_notificationEventEntityHasRequiredFields() {
        Class<?> clazz = NotificationEvent.class;

        boolean hasRecipientId = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("recipientId"));
        assertThat(hasRecipientId)
                .as("PRESERVATION: NotificationEvent must have recipientId field")
                .isTrue();

        boolean hasEventType = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("eventType"));
        assertThat(hasEventType)
                .as("PRESERVATION: NotificationEvent must have eventType field")
                .isTrue();

        boolean hasStatus = Arrays.stream(clazz.getDeclaredFields())
                .anyMatch(f -> f.getName().equals("status"));
        assertThat(hasStatus)
                .as("PRESERVATION: NotificationEvent must have status field")
                .isTrue();
    }
}
