package com.templeregistry.service.impl.notification;

import com.templeregistry.dto.request.admin.UpdateNotificationRuleRequest;
import com.templeregistry.dto.response.admin.NotificationRuleResponse;
import com.templeregistry.entity.notification.NotificationRule;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.notification.NotificationRuleRepository;
import com.templeregistry.service.notification.impl.NotificationRuleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationRuleServiceImplTest {

    @Mock
    private NotificationRuleRepository notificationRuleRepository;

    @InjectMocks
    private NotificationRuleServiceImpl notificationRuleService;

    private NotificationRule activeRule;
    private NotificationRule deletedRule;

    @BeforeEach
    void setUp() {
        activeRule = NotificationRule.builder()
                .eventType("WORKFLOW_TRANSITION")
                .entityType("DECLARATION")
                .action("APPROVE")
                .recipientType("TA")
                .channel("EMAIL")
                .priority("HIGH")
                .templateKey("declaration.approved")
                .enabled(true)
                .build();
        activeRule.setId(1L);
        activeRule.setDeleted(false);

        deletedRule = NotificationRule.builder()
                .eventType("SYSTEM")
                .entityType("*")
                .action("ARCHIVE")
                .recipientType("ADMIN")
                .channel("EMAIL")
                .priority("LOW")
                .templateKey("temple.archived")
                .enabled(true)
                .build();
        deletedRule.setId(2L);
        deletedRule.setDeleted(true);
    }

    @Test
    void should_return_only_active_rules_when_some_are_soft_deleted() {
        when(notificationRuleRepository.findAll()).thenReturn(List.of(activeRule, deletedRule));

        List<NotificationRuleResponse> result = notificationRuleService.listActiveRules();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getEventType()).isEqualTo("WORKFLOW_TRANSITION");
    }

    @Test
    void should_return_empty_list_when_all_rules_are_deleted() {
        when(notificationRuleRepository.findAll()).thenReturn(List.of(deletedRule));

        List<NotificationRuleResponse> result = notificationRuleService.listActiveRules();

        assertThat(result).isEmpty();
    }

    @Test
    void should_update_rule_when_rule_exists_and_is_active() {
        UpdateNotificationRuleRequest request = new UpdateNotificationRuleRequest();
        request.setEnabled(false);
        request.setPriority("MEDIUM");
        request.setDescription("Updated description");

        when(notificationRuleRepository.findById(1L)).thenReturn(Optional.of(activeRule));
        when(notificationRuleRepository.save(any(NotificationRule.class))).thenReturn(activeRule);

        NotificationRuleResponse result = notificationRuleService.updateRule(1L, request);

        assertThat(result).isNotNull();
        verify(notificationRuleRepository).save(activeRule);
        assertThat(activeRule.getPriority()).isEqualTo("MEDIUM");
        assertThat(activeRule.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void should_throw_when_rule_not_found() {
        when(notificationRuleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationRuleService.updateRule(99L, new UpdateNotificationRuleRequest()))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void should_throw_when_rule_is_soft_deleted() {
        when(notificationRuleRepository.findById(2L)).thenReturn(Optional.of(deletedRule));

        assertThatThrownBy(() -> notificationRuleService.updateRule(2L, new UpdateNotificationRuleRequest()))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void should_not_override_priority_when_null_provided() {
        UpdateNotificationRuleRequest request = new UpdateNotificationRuleRequest();
        request.setEnabled(false);
        // priority and description left null

        when(notificationRuleRepository.findById(1L)).thenReturn(Optional.of(activeRule));
        when(notificationRuleRepository.save(any(NotificationRule.class))).thenReturn(activeRule);

        notificationRuleService.updateRule(1L, request);

        // Priority should not change from original "HIGH"
        assertThat(activeRule.getPriority()).isEqualTo("HIGH");
    }
}
