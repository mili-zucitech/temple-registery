package com.templeregistry.service.notification.impl;

import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dispatches notifications via the appropriate channel (IN_APP, EMAIL, BOTH).
 * Acts as bridge between the NotificationRouter and low-level delivery services.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatchServiceImpl implements com.templeregistry.service.notification.NotificationDispatchService {

    private final com.templeregistry.service.notification.NotificationService notificationService;    // existing in-app service
    private final EmailDeliveryService emailDeliveryService;
    private final SseNotificationService sseService;
    private final com.templeregistry.service.notification.NotificationPreferenceService notificationPreferenceService;
    private final com.templeregistry.service.notification.EmailService emailService;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(GovernanceDomainEvent event) {
        // This method is called from NotificationRouter with the event
        // For now, we log it - actual dispatch happens via the 3-arg method below
        log.debug("[NotificationDispatch] Received event: {}", event);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(GovernanceDomainEvent event, NotificationRule rule, Long recipientId) {
        String title = buildTitle(event, rule);
        String body  = buildBody(event, rule);
        String entityTypeName = event.entityType() != null ? event.entityType().name() : "ENTITY";
        com.templeregistry.event.base.ModuleType moduleType = resolveModuleType(entityTypeName);

        boolean sendInApp  = "IN_APP".equals(rule.getChannel()) || "BOTH".equals(rule.getChannel());
        boolean sendEmail  = "EMAIL".equals(rule.getChannel()) || "BOTH".equals(rule.getChannel());

        if (sendInApp) {
            try {
                if (notificationPreferenceService.isInAppEnabled(recipientId, moduleType)) {
                    log.info("[FLOW_3] preference pass recipientId={} moduleType={} channel={}",
                        recipientId, moduleType, rule.getChannel());
                    notificationService.createInAppNotification(
                        recipientId, title, body,
                        rule.getPriority(), entityTypeName,
                        event.entityId(), event.workflowInstanceId()
                    );
                    // Real-time SSE push (best-effort — does not fail dispatch)
                    sseService.push(recipientId, title, body);
                    sseService.pushBadgeCount(recipientId, notificationService.countUnread(recipientId));
                    log.info("[FLOW_6] SSE push sent recipientId={}", recipientId);
                } else {
                    log.info("[FLOW_3] in-app BLOCKED by preference recipientId={} moduleType={}",
                        recipientId, moduleType);
                }
            } catch (Exception e) {
                log.error("[NotificationDispatch] In-app delivery failed for recipient={}: {}", recipientId, e.getMessage(), e);
            }
        }

        if (sendEmail) {
            try {
                if (notificationPreferenceService.isEmailEnabled(recipientId, moduleType)) {
                    emailDeliveryService.enqueue(EmailRequest.builder()
                        .recipientId(recipientId)
                        .templateKey(rule.getTemplateKey())
                        .entityType(entityTypeName)
                        .entityId(event.entityId())
                        .subject(title)
                        .metadata(event.metadata())
                        .build());
                    
                    // EC-13: For high/critical priority, also call the immediate email service
                    if ("HIGH".equals(rule.getPriority()) || "CRITICAL".equals(rule.getPriority())) {
                        emailService.sendNotification(recipientId, title, rule.getTemplateKey(), event.metadata());
                    }
                }
            } catch (Exception e) {
                log.error("[NotificationDispatch] Email queue failed for recipient={}: {}", recipientId, e.getMessage());
            }
        }

        log.debug("[NotificationDispatch] Dispatched {} to recipient={} via {}", rule.getTemplateKey(), recipientId, rule.getChannel());
    }

    private com.templeregistry.event.base.ModuleType resolveModuleType(String entityTypeName) {
        try {
            return com.templeregistry.event.base.ModuleType.valueOf(entityTypeName);
        } catch (IllegalArgumentException ex) {
            log.debug("[NotificationDispatch] Falling back to SYSTEM module for unknown entityType={}", entityTypeName);
            return com.templeregistry.event.base.ModuleType.SYSTEM;
        }
    }

    private String buildTitle(GovernanceDomainEvent event, NotificationRule rule) {
        String entityTypeName = event.entityType() != null ? event.entityType().name() : "Record";

        if ("TEMPLE_PROFILE".equals(entityTypeName) && event.action() == com.templeregistry.entity.workflow.WorkflowAction.APPROVE) {
            return "Temple profile approved by District Commissioner";
        }
        if ("TEMPLE_PROFILE".equals(entityTypeName) && event.action() == com.templeregistry.entity.workflow.WorkflowAction.REQUEST_CLARIFICATION) {
            return "Clarification requested on Temple Profile";
        }

        return switch (rule.getTemplateKey()) {
            case "submission-notification"          -> entityTypeName + " submitted for review";
            case "approval-notification"            -> entityTypeName + " approved";
            case "rejection-notification"           -> entityTypeName + " rejected";
            case "clarification-request"            -> "Clarification requested on " + entityTypeName;
            case "clarification-response"           -> "Clarification response received for " + entityTypeName;
            case "resubmission-notification"        -> entityTypeName + " resubmitted";
            case "edit-after-approval-notification" -> entityTypeName + " modified after approval";
            case "review-started-notification"      -> "DC has started reviewing " + entityTypeName;
            case "overdue-notification"             -> entityTypeName + " is overdue";
            case "withdrawal-notification"          -> entityTypeName + " withdrawn";
            default                                 -> "Update on " + entityTypeName;
        };
    }

    private String buildBody(GovernanceDomainEvent event, NotificationRule rule) {
        String comment = event.metadata() != null
            ? String.valueOf(event.metadata().getOrDefault("comment", ""))
            : "";
        if (!comment.isBlank()) {
            return "Comment: " + comment;
        }
        return "Please log in to the Temple Registry portal to view the update.";
    }
}
