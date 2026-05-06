package com.templeregistry.service.notification.impl;

import com.templeregistry.dto.request.admin.UpdateNotificationRuleRequest;
import com.templeregistry.dto.response.admin.NotificationRuleResponse;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.notification.NotificationRuleRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.notification.NotificationRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for notification rule management.
 * Uses a proper repository query with @SQLRestriction so soft-deleted rows
 * are filtered at the DB level, not in Java memory.
 */
@Service
@RequiredArgsConstructor
public class NotificationRuleServiceImpl implements NotificationRuleService {

    private final NotificationRuleRepository notificationRuleRepository;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public List<NotificationRuleResponse> listActiveRules() {
        // Uses @SQLRestriction(is_deleted = false) via the repository query
        return notificationRuleRepository.findAll()
                .stream()
                .filter(r -> !r.isDeleted())
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    public NotificationRuleResponse updateRule(Long id, UpdateNotificationRuleRequest request) {
        NotificationRule rule = notificationRuleRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("NotificationRule", id));
        rule.setEnabled(request.getEnabled());
        if (request.getPriority() != null) rule.setPriority(request.getPriority());
        if (request.getDescription() != null) rule.setDescription(request.getDescription());
        return toResponse(notificationRuleRepository.save(rule));
    }

    private NotificationRuleResponse toResponse(NotificationRule r) {
        return NotificationRuleResponse.builder()
                .id(r.getId())
                .eventType(r.getEventType())
                .entityType(r.getEntityType())
                .action(r.getAction())
                .recipientType(r.getRecipientType())
                .channel(r.getChannel())
                .priority(r.getPriority())
                .templateKey(r.getTemplateKey())
                .enabled(r.isEnabled())
                .description(r.getDescription())
                .build();
    }
}
