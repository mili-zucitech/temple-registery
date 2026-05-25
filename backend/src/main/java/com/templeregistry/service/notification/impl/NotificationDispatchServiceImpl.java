package com.templeregistry.service.notification.impl;

import com.templeregistry.entity.auth.User;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.temple.TempleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dispatches notifications via the appropriate channel (IN_APP, EMAIL, BOTH).
 * Builds workflow-aware rich messages that include temple name and actor name.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationDispatchServiceImpl implements com.templeregistry.service.notification.NotificationDispatchService {

    private final com.templeregistry.service.notification.NotificationService notificationService;
    private final EmailDeliveryService emailDeliveryService;
    private final SseNotificationService sseService;
    private final com.templeregistry.service.notification.NotificationPreferenceService notificationPreferenceService;
    private final com.templeregistry.service.notification.EmailService emailService;
    private final TempleRepository templeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(GovernanceDomainEvent event) {
        log.debug("[NotificationDispatch] Received event: {}", event);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatch(GovernanceDomainEvent event, NotificationRule rule, Long recipientId) {
        // ── Resolve rich context ────────────────────────────────────────────
        String templeName  = resolveTempleName(event.templeId());
        String actorLabel  = resolveActorLabel(event.actorId());
        String reason      = extractReason(event);

        String title          = buildRichTitle(event, templeName, actorLabel);
        String body           = buildRichBody(event, templeName, actorLabel, reason, rule.getRecipientType());
        String notifType      = buildNotificationType(event);
        String redirectUrl    = buildRedirectUrl(event, rule.getRecipientType());
        String entityTypeName = event.entityType() != null ? event.entityType().name() : "SYSTEM";
        String workflowStatus = event.toStatus() != null ? event.toStatus().name() : null;

        com.templeregistry.event.base.ModuleType moduleType = resolveModuleType(entityTypeName);

        boolean sendInApp = "IN_APP".equals(rule.getChannel()) || "BOTH".equals(rule.getChannel());
        boolean sendEmail = "EMAIL".equals(rule.getChannel()) || "BOTH".equals(rule.getChannel());

        if (sendInApp) {
            try {
                if (notificationPreferenceService.isInAppEnabled(recipientId, moduleType)) {
                    log.info("[FLOW_3] preference pass recipientId={} moduleType={} channel={}",
                            recipientId, moduleType, rule.getChannel());
                    notificationService.createInAppNotification(
                            recipientId, title, body,
                            rule.getPriority(), notifType, entityTypeName,
                            event.entityId(), event.workflowInstanceId(),
                            event.templeId(), templeName,
                            actorLabel, event.actorRole(),
                            redirectUrl, workflowStatus
                    );
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
                    // Build enriched context so templates have all variables they need.
                    // The raw event.metadata() only carries "comment" and "transitionId".
                    // We add the computed rich fields here.
                    java.util.Map<String, Object> enrichedMetadata = new java.util.HashMap<>(
                        event.metadata() != null ? event.metadata() : java.util.Map.of()
                    );
                    enrichedMetadata.put("body",           body);
                    enrichedMetadata.put("templeName",     templeName);
                    enrichedMetadata.put("actorLabel",     actorLabel);
                    enrichedMetadata.put("actorName",      resolveActorName(event.actorId()));
                    enrichedMetadata.put("reason",         reason != null ? reason : "");
                    enrichedMetadata.put("redirectUrl",    redirectUrl);
                    enrichedMetadata.put("entityType",     entityTypeName);
                    enrichedMetadata.put("workflowStatus", workflowStatus != null ? workflowStatus : "");
                    enrichedMetadata.put("priority",       rule.getPriority());
                    enrichedMetadata.put("action",         event.action() != null ? event.action().name() : "");

                    emailDeliveryService.enqueue(EmailRequest.builder()
                            .recipientId(recipientId)
                            .templateKey(rule.getTemplateKey())
                            .entityType(entityTypeName)
                            .entityId(event.entityId())
                            .subject(title)
                            .metadata(enrichedMetadata)
                            .build());
                    // HIGH/CRITICAL: also enqueue with elevated priority — the DB outbox
                    // processes HIGH/CRITICAL items first (ordered by priority in the query).
                    // No separate synchronous fast-path needed; the outbox worker runs every 10s.
                }
            } catch (Exception e) {
                log.error("[NotificationDispatch] Email queue failed for recipient={}: {}", recipientId, e.getMessage());
            }
        }

        log.debug("[NotificationDispatch] Dispatched {} to recipient={} via {}",
                rule.getTemplateKey(), recipientId, rule.getChannel());
    }

    // ── Context resolution ──────────────────────────────────────────────────

    private String resolveTempleName(Long templeId) {
        if (templeId == null) return "the temple";
        return templeRepository.findById(templeId)
                .map(Temple::getName)
                .orElse("the temple");
    }

    private String resolveActorLabel(Long actorId) {
        if (actorId == null) return "System";
        return userRepository.findById(actorId).map(user -> {
            String roleLabel = switch (user.getRole()) {
                case SUPER_ADMIN         -> "Super Administrator";
                case DISTRICT_COLLECTOR  -> "District Commissioner";
                case DC_STAFF            -> "DC Staff";
                case TEMPLE_AUTHORITY    -> "Temple Authority";
                case AUDITOR             -> "Auditor";
                case VIEWER              -> "Viewer";
            };
            return roleLabel + " - " + user.getFullName();
        }).orElse("System");
    }

    private String resolveActorName(Long actorId) {
        if (actorId == null) return "System";
        return userRepository.findById(actorId)
                .map(User::getFullName)
                .orElse("System");
    }

    private String extractReason(GovernanceDomainEvent event) {
        if (event.metadata() == null) return null;
        Object reason = event.metadata().get("reason");
        if (reason == null) reason = event.metadata().get("comment");
        if (reason == null) reason = event.metadata().get("remarks");
        String r = reason != null ? reason.toString().trim() : null;
        return (r != null && !r.isEmpty()) ? r : null;
    }

    // ── Rich message builders ───────────────────────────────────────────────

    private String buildNotificationType(GovernanceDomainEvent event) {
        String entityPart = event.entityType() != null ? event.entityType().name() : "SYSTEM";
        String actionPart = event.action()     != null ? event.action().name()     : "UPDATE";
        return entityPart + "_" + actionPart;
    }

    private String buildRichTitle(GovernanceDomainEvent event, String templeName, String actorLabel) {
        WorkflowEntityType entityType = event.entityType();
        WorkflowAction     action     = event.action();

        // Resolve just the actor's full name (not the role prefix) for the title
        String actorName = resolveActorName(event.actorId());

        if (entityType == WorkflowEntityType.TEMPLE_PROFILE) {
            if (action == WorkflowAction.SUBMIT)              return templeName + " – Profile Submitted";
            if (action == WorkflowAction.APPROVE)             return templeName + " – Profile Approved by " + actorName;
            if (action == WorkflowAction.REJECT)              return templeName + " – Profile Rejected by " + actorName;
            if (action == WorkflowAction.RESUBMIT)            return templeName + " – Profile Resubmitted";
            if (action == WorkflowAction.REQUEST_CLARIFICATION) return templeName + " – Clarification Requested";
            if (action == WorkflowAction.RESPOND_CLARIFICATION) return templeName + " – Clarification Response Received";
            if (action == WorkflowAction.BEGIN_REVIEW)        return templeName + " – DC Started Review";
            if (action == WorkflowAction.SEND_BACK)           return templeName + " – Profile Sent Back for Revision";
        }

        if (entityType == WorkflowEntityType.TRUST) {
            if (action == WorkflowAction.SUBMIT)              return templeName + " – Trust Submitted";
            if (action == WorkflowAction.APPROVE)             return templeName + " – Trust Approved by " + actorName;
            if (action == WorkflowAction.REJECT)              return templeName + " – Trust Rejected by " + actorName;
            if (action == WorkflowAction.SEND_BACK)           return templeName + " – Trust Sent Back for Revision";
        }

        if (entityType == WorkflowEntityType.EMPLOYEE) {
            if (action == WorkflowAction.SUBMIT || action == WorkflowAction.APPROVE) return templeName + " – Employee Added";
            if (action == WorkflowAction.EDIT_APPROVED)       return templeName + " – Employee Updated";
            if (action == WorkflowAction.REJECT)              return templeName + " – Employee Removed";
        }

        if (entityType == WorkflowEntityType.CONTRACTOR) {
            if (action == WorkflowAction.SUBMIT || action == WorkflowAction.APPROVE) return templeName + " – Contractor Added";
            if (action == WorkflowAction.EDIT_APPROVED)       return templeName + " – Contractor Updated";
            if (action == WorkflowAction.REJECT)              return templeName + " – Contractor Removed";
        }

        if (entityType == WorkflowEntityType.DOCUMENT) {
            if (action == WorkflowAction.SUBMIT)              return templeName + " – Document Uploaded";
            if (action == WorkflowAction.REJECT)              return templeName + " – Document Rejected by " + actorName;
        }

        // Fallback: human-readable from enum names
        String entityLabel = entityType != null ? toReadable(entityType.name()) : "Record";
        String actionLabel = action     != null ? toReadable(action.name())     : "Updated";
        return templeName + " – " + entityLabel + " " + actionLabel;
    }

    private String buildRichBody(GovernanceDomainEvent event, String templeName, String actorLabel,
                                  String reason, String recipientType) {
        WorkflowEntityType entityType = event.entityType();
        WorkflowAction     action     = event.action();

        if (entityType == WorkflowEntityType.TEMPLE_PROFILE) {
            return switch (action != null ? action : WorkflowAction.SUBMIT) {
                case SUBMIT -> templeName + " profile has been submitted for District Commissioner review.";
                case RESUBMIT -> templeName + " profile has been resubmitted for District Commissioner review.";
                case APPROVE -> actorLabel + " approved the profile of " + templeName + ".";
                case REJECT -> buildRejectionBody(actorLabel,
                        "the profile of " + templeName, reason);
                case REQUEST_CLARIFICATION -> actorLabel +
                        " has requested clarification on the profile of " + templeName +
                        (reason != null ? ": " + reason : ".");
                case RESPOND_CLARIFICATION -> templeName + " Temple Authority has responded to the clarification request.";
                case BEGIN_REVIEW -> actorLabel + " has started reviewing the profile of " + templeName + ".";
                case SEND_BACK -> actorLabel + " sent back the profile of " + templeName + " for revision" +
                        (reason != null ? ". Reason: " + reason : ".");
                default -> "An update was made to the profile of " + templeName + ".";
            };
        }

        if (entityType == WorkflowEntityType.TRUST) {
            return switch (action != null ? action : WorkflowAction.SUBMIT) {
                case SUBMIT -> "Trust details for " + templeName + " have been submitted for review.";
                case APPROVE -> "Trust details for " + templeName + " have been approved by " + actorLabel + ".";
                case REJECT -> buildRejectionBody(actorLabel,
                        "the trust details of " + templeName, reason);
                case SEND_BACK -> "Trust details for " + templeName + " sent back for revision" +
                        (reason != null ? ". Reason: " + reason : ".");
                default -> "Trust details for " + templeName + " have been updated.";
            };
        }

        if (entityType == WorkflowEntityType.EMPLOYEE) {
            return switch (action != null ? action : WorkflowAction.APPROVE) {
                case SUBMIT, APPROVE -> "An employee record has been added for " + templeName + ".";
                case EDIT_APPROVED   -> "An employee record has been updated for " + templeName + ".";
                case REJECT          -> "An employee record has been removed from " + templeName + ".";
                default              -> "An employee change has been made for " + templeName + ".";
            };
        }

        if (entityType == WorkflowEntityType.CONTRACTOR) {
            return switch (action != null ? action : WorkflowAction.APPROVE) {
                case SUBMIT, APPROVE -> "A contractor record has been added for " + templeName + ".";
                case EDIT_APPROVED   -> "A contractor record has been updated for " + templeName + ".";
                case REJECT          -> "A contractor record has been removed from " + templeName + ".";
                default              -> "A contractor change has been made for " + templeName + ".";
            };
        }

        if (entityType == WorkflowEntityType.DOCUMENT) {
            return switch (action != null ? action : WorkflowAction.SUBMIT) {
                case SUBMIT -> "A new document has been uploaded for " + templeName + ".";
                case REJECT -> buildRejectionBody(actorLabel,
                        "a document of " + templeName, reason);
                default     -> "A document change has been made for " + templeName + ".";
            };
        }

        // Generic fallback
        return "An update has been made. Please log in to the Temple Registry portal for details.";
    }

    private String buildRejectionBody(String actorLabel, String entityLabel, String reason) {
        String base = actorLabel + " rejected " + entityLabel + ".";
        return reason != null ? base + " Reason: " + reason : base;
    }

    /**
     * Builds the redirect URL the frontend should navigate to when the user clicks the notification.
     * TA recipients get module-specific TA routes; DC recipients get the temple profile route.
     */
    private String buildRedirectUrl(GovernanceDomainEvent event, String recipientType) {
        WorkflowEntityType entityType = event.entityType();
        Long templeId = event.templeId();

        if ("DC".equals(recipientType)) {
            return templeId != null ? "/dc/temples/" + templeId : "/dc/dashboard";
        }

        // TA routes
        if (entityType == WorkflowEntityType.TEMPLE_PROFILE)  return "/ta/temple";
        if (entityType == WorkflowEntityType.TRUST)            return "/ta/trust";
        if (entityType == WorkflowEntityType.EMPLOYEE)         return "/ta/employees";
        if (entityType == WorkflowEntityType.CONTRACTOR)       return "/ta/contractors";
        if (entityType == WorkflowEntityType.DOCUMENT)         return "/ta/documents";

        return "/notifications";
    }

    // ── Utilities ───────────────────────────────────────────────────────────

    private com.templeregistry.event.base.ModuleType resolveModuleType(String entityTypeName) {
        try {
            return com.templeregistry.event.base.ModuleType.valueOf(entityTypeName);
        } catch (IllegalArgumentException ex) {
            return com.templeregistry.event.base.ModuleType.SYSTEM;
        }
    }

    /** Converts SNAKE_CASE enum name to "Title Case" for display fallback. */
    private String toReadable(String enumName) {
        if (enumName == null || enumName.isEmpty()) return "";
        String[] parts = enumName.split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!sb.isEmpty()) sb.append(' ');
            sb.append(Character.toUpperCase(part.charAt(0)));
            sb.append(part.substring(1).toLowerCase());
        }
        return sb.toString();
    }
}
