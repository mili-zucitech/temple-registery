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

    @Test
    @DisplayName("Should allow TA to RESUBMIT from UPDATED_AFTER_APPROVAL")
    void should_allowTaResubmit_when_statusIsUpdatedAfterApproval() {
        TransitionRule rule = registry.find("TRUST", WorkflowStatus.UPDATED_AFTER_APPROVAL, WorkflowAction.RESUBMIT)
            .orElseThrow(() -> new AssertionError("RESUBMIT from UPDATED_AFTER_APPROVAL rule not found"));

        assertEquals(WorkflowStatus.RESUBMITTED, rule.getToStatus());
        assertEquals("TA", rule.getRequiredRole());
    }

    @Test
    @DisplayName("Should NOT allow DC to SEND_BACK from UPDATED_AFTER_APPROVAL")
    void should_notAllowDcSendBack_when_statusIsUpdatedAfterApproval() {
        java.util.Optional<TransitionRule> rule = registry.find("TRUST", WorkflowStatus.UPDATED_AFTER_APPROVAL, WorkflowAction.SEND_BACK);
        assertTrue(rule.isEmpty(), "DC must NOT be able to SEND_BACK from UPDATED_AFTER_APPROVAL — TA resubmit is required first");
    }

    @Test
    @DisplayName("Should NOT allow DC to APPROVE from UPDATED_AFTER_APPROVAL")
    void should_notAllowDcApprove_when_statusIsUpdatedAfterApproval() {
        java.util.Optional<TransitionRule> rule = registry.find("TRUST", WorkflowStatus.UPDATED_AFTER_APPROVAL, WorkflowAction.APPROVE);
        assertTrue(rule.isEmpty(), "DC must NOT be able to APPROVE from UPDATED_AFTER_APPROVAL — TA resubmit is required first");
    }

    @Test
    @DisplayName("UPDATED_AFTER_APPROVAL → RESUBMIT → RESUBMITTED lifecycle check")
    void should_completeUpdateAfterApprovalLifecycle() {
        // Step 1: TA edits approved entity → UPDATED_AFTER_APPROVAL (via EDIT_APPROVED from APPROVED)
        TransitionRule editRule = registry.find("*", WorkflowStatus.APPROVED, WorkflowAction.EDIT_APPROVED)
            .orElseThrow(() -> new AssertionError("EDIT_APPROVED from APPROVED rule not found"));
        assertEquals(WorkflowStatus.UPDATED_AFTER_APPROVAL, editRule.getToStatus());
        assertEquals("TA", editRule.getRequiredRole());

        // Step 2: TA resubmits → RESUBMITTED
        TransitionRule resubmitRule = registry.find("*", WorkflowStatus.UPDATED_AFTER_APPROVAL, WorkflowAction.RESUBMIT)
            .orElseThrow(() -> new AssertionError("RESUBMIT from UPDATED_AFTER_APPROVAL rule not found"));
        assertEquals(WorkflowStatus.RESUBMITTED, resubmitRule.getToStatus());
        assertEquals("TA", resubmitRule.getRequiredRole());

        // Step 3: DC can RE_APPROVE from RESUBMITTED
        TransitionRule reApproveRule = registry.find("*", WorkflowStatus.RESUBMITTED, WorkflowAction.RE_APPROVE)
            .orElseThrow(() -> new AssertionError("RE_APPROVE from RESUBMITTED rule not found"));
        assertEquals(WorkflowStatus.RE_APPROVED, reApproveRule.getToStatus());
        assertEquals("DC", reApproveRule.getRequiredRole());
    }

    @Test
    @DisplayName("findAllForStatus should return only DC rules for SUBMITTED status")
    void should_returnOnlyDcRules_when_queryingSubmittedStatusForDcRole() {
        List<TransitionRule> dcRules = registry.findAllForStatus("TRUST", WorkflowStatus.SUBMITTED)
            .stream()
            .filter(r -> "DC".equals(r.getRequiredRole()))
            .toList();

        assertFalse(dcRules.isEmpty());
        assertTrue(dcRules.stream().allMatch(r -> "DC".equals(r.getRequiredRole())));
        assertTrue(dcRules.stream().anyMatch(r -> r.getAction() == WorkflowAction.APPROVE));
        assertTrue(dcRules.stream().anyMatch(r -> r.getAction() == WorkflowAction.SEND_BACK));
    }

    @Test
    @DisplayName("findAllForStatus should return only TA rules for UPDATED_AFTER_APPROVAL")
    void should_returnOnlyTaRules_when_queryingUpdatedAfterApprovalStatus() {
        List<TransitionRule> allRules = registry.findAllForStatus("TRUST", WorkflowStatus.UPDATED_AFTER_APPROVAL);

        assertFalse(allRules.isEmpty());
        // All rules from UPDATED_AFTER_APPROVAL must be for TA, not DC
        assertTrue(allRules.stream().noneMatch(r -> "DC".equals(r.getRequiredRole())),
            "DC must have no allowed actions from UPDATED_AFTER_APPROVAL — only TA can resubmit");
        assertTrue(allRules.stream().anyMatch(r -> "TA".equals(r.getRequiredRole()) && r.getAction() == WorkflowAction.RESUBMIT));
    }

    @Test
    @DisplayName("REJECT_EDIT from RESUBMITTED should transition to RE_APPROVED (non-terminal edit rejection)")
    void should_transitionToReApproved_when_rejectEditFromResubmitted() {
        TransitionRule rule = registry.find("*", WorkflowStatus.RESUBMITTED, WorkflowAction.REJECT_EDIT)
            .orElseThrow(() -> new AssertionError("REJECT_EDIT from RESUBMITTED rule not found"));

        assertEquals(WorkflowStatus.RE_APPROVED, rule.getToStatus(),
            "Edit rejection must revert to RE_APPROVED — trust is still valid with restored approved data");
        assertEquals("DC", rule.getRequiredRole());
    }

    @Test
    @DisplayName("REJECT from RESUBMITTED should still transition to REJECTED (first-time rejection from RESUBMITTED is not applicable but rule exists)")
    void should_transitionToRejected_when_rejectFromResubmitted() {
        TransitionRule rule = registry.find("*", WorkflowStatus.RESUBMITTED, WorkflowAction.REJECT)
            .orElseThrow(() -> new AssertionError("REJECT from RESUBMITTED rule not found"));

        assertEquals(WorkflowStatus.REJECTED, rule.getToStatus());
        assertEquals("DC", rule.getRequiredRole());
    }

    @Test
    @DisplayName("REJECT_EDIT from UNDER_REVIEW should transition to RE_APPROVED (DC marked under-review before rejecting edit)")
    void should_transitionToReApproved_when_rejectEditFromUnderReview() {
        TransitionRule rule = registry.find("*", WorkflowStatus.UNDER_REVIEW, WorkflowAction.REJECT_EDIT)
            .orElseThrow(() -> new AssertionError("REJECT_EDIT from UNDER_REVIEW rule not found"));

        assertEquals(WorkflowStatus.RE_APPROVED, rule.getToStatus(),
            "Edit rejection from UNDER_REVIEW must revert to RE_APPROVED — matches RESUBMITTED→REJECT_EDIT path");
        assertEquals("DC", rule.getRequiredRole());
    }

    @Test
    @DisplayName("Full edit-rejection lifecycle: APPROVED → EDIT_APPROVED → UPDATED_AFTER_APPROVAL → RESUBMIT → RESUBMITTED → REJECT_EDIT → RE_APPROVED")
    void should_completeEditRejectionLifecycle() {
        // Step 1: APPROVED → EDIT_APPROVED → UPDATED_AFTER_APPROVAL
        TransitionRule editRule = registry.find("*", WorkflowStatus.APPROVED, WorkflowAction.EDIT_APPROVED)
            .orElseThrow();
        assertEquals(WorkflowStatus.UPDATED_AFTER_APPROVAL, editRule.getToStatus());

        // Step 2: UPDATED_AFTER_APPROVAL → RESUBMIT → RESUBMITTED
        TransitionRule resubmitRule = registry.find("*", WorkflowStatus.UPDATED_AFTER_APPROVAL, WorkflowAction.RESUBMIT)
            .orElseThrow();
        assertEquals(WorkflowStatus.RESUBMITTED, resubmitRule.getToStatus());

        // Step 3: DC rejects the edit → RESUBMITTED + REJECT_EDIT → RE_APPROVED
        TransitionRule rejectEditRule = registry.find("*", WorkflowStatus.RESUBMITTED, WorkflowAction.REJECT_EDIT)
            .orElseThrow();
        assertEquals(WorkflowStatus.RE_APPROVED, rejectEditRule.getToStatus());
        assertEquals("DC", rejectEditRule.getRequiredRole());
    }
}
