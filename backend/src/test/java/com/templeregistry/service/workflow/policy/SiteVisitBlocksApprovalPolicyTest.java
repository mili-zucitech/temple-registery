package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SiteVisitBlocksApprovalPolicyTest {

    private final SiteVisitBlocksApprovalPolicy policy = new SiteVisitBlocksApprovalPolicy();

    @Test
    @DisplayName("Should DENY approval if physical verification FAILED")
    void testDenyIfFailed() {
        // Given
        WorkflowInstance instance = WorkflowInstance.builder()
            .entityType(com.templeregistry.entity.workflow.WorkflowEntityType.DECLARATION)
            .subStatus("VERIFICATION_FAILED")
            .build();
        
        ActionContext context = ActionContext.builder()
            .actorRole("DC")
            .build();

        // When
        PolicyResult result = policy.evaluate(instance, context);

        // Then
        assertFalse(result.isAllowed());
        assertTrue(result.getDenyReason().contains("Physical verification has FAILED"));
    }

    @Test
    @DisplayName("Should ALLOW approval if physical verification is NOT failed")
    void testAllowIfNormal() {
        // Given
        WorkflowInstance instance = WorkflowInstance.builder()
            .entityType(com.templeregistry.entity.workflow.WorkflowEntityType.DECLARATION)
            .subStatus("PHYSICALLY_VERIFIED")
            .build();
        
        ActionContext context = ActionContext.builder()
            .actorRole("DC")
            .build();

        // When
        PolicyResult result = policy.evaluate(instance, context);

        // Then
        assertTrue(result.isAllowed());
    }
}
