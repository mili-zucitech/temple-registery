package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TransitionRuleRegistryTest {

    private TransitionRuleRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new TransitionRuleRegistry();
    }

    @Test
    @DisplayName("Should find correct transition for OVERDUE flagging (Req 1.6)")
    void testOverdueTransitions() {
        // Given
        String entityType = "DECLARATION";
        WorkflowStatus currentStatus = WorkflowStatus.SUBMITTED;
        WorkflowAction action = WorkflowAction.FLAG_OVERDUE;

        // When
        TransitionRule rule = registry.find(entityType, currentStatus, action)
            .orElseThrow(() -> new AssertionError("Rule not found for FLAG_OVERDUE"));

        // Then
        assertEquals(WorkflowStatus.OVERDUE, rule.getToStatus());
        assertEquals("SYSTEM", rule.getRequiredRole());
        assertEquals("FLAG_OVERDUE", rule.getSubStatusEffect());
    }

    @ParameterizedTest
    @CsvSource({
        "DECLARATION, UNDER_REVIEW, SCHEDULE_SITE_VISIT, UNDER_REVIEW, SITE_VISIT_SCHEDULED",
        "DECLARATION, UNDER_REVIEW, FAIL_SITE_VISIT, UNDER_REVIEW, VERIFICATION_FAILED",
        "DECLARATION, UNDER_REVIEW, VERIFY_SITE_VISIT, UNDER_REVIEW, PHYSICALLY_VERIFIED"
    })
    @DisplayName("Should find module-specific transitions for Declarations")
    void testDeclarationSpecificTransitions(String type, WorkflowStatus from, WorkflowAction action, WorkflowStatus to, String subStatus) {
        TransitionRule rule = registry.find(type, from, action)
            .orElseThrow(() -> new AssertionError("Rule not found"));
        
        assertEquals(to, rule.getToStatus());
        assertEquals(subStatus, rule.getSubStatusEffect());
    }

    @Test
    @DisplayName("Wildcard '*' should match any entity type with lower precedence")
    void testWildcardMatching() {
        // Given: We have a specific rule for DECLARATION + APPROVE and a wildcard '*' + APPROVE
        // In the registry, module-specific rules should take precedence if they exist, 
        // but here they share the same target status for APPROVE.
        
        TransitionRule rule = registry.find("TRUST", WorkflowStatus.SUBMITTED, WorkflowAction.APPROVE)
            .orElseThrow(() -> new AssertionError("Rule not found"));
            
        assertEquals(WorkflowStatus.APPROVED, rule.getToStatus());
    }
}
