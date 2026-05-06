package com.templeregistry.service.notification;

import com.templeregistry.dto.request.admin.UpdateNotificationRuleRequest;
import com.templeregistry.dto.response.admin.NotificationRuleResponse;

import java.util.List;

/**
 * Service interface for managing notification routing rules.
 * Extracted from AdminController to enforce the Controller → Service → Repository pattern
 * and ensure @SQLRestriction on is_deleted is honoured at the DB query level.
 */
public interface NotificationRuleService {

    /** Return all active (not deleted) notification rules. */
    List<NotificationRuleResponse> listActiveRules();

    /** Update an existing rule's enabled flag, priority, and description. */
    NotificationRuleResponse updateRule(Long id, UpdateNotificationRuleRequest request);
}
