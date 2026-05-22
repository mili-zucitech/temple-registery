package com.templeregistry.service.workflow.policy;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.PolicyResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for all workflow policies:
 * - ClarificationCommentRequiredPolicy
 * - DeclarationApprovalPolicy (deprecated, but logic still testable)
 * - DeclarationUniqueSubmissionPolicy
 */
class WorkflowPolicyTest {

    // ─── ClarificationCommentRequiredPolicy ───────────────────────────────────

    @Nested
    class ClarificationCommentRequiredPolicyTests {

        private final ClarificationCommentRequiredPolicy policy = new ClarificationCommentRequiredPolicy();

        @Test
        void should_alwaysAllow_when_evaluated() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .status(WorkflowStatus.SUBMITTED)
                .build();
            ActionContext context = ActionContext.builder().actorRole("DC").build();

            PolicyResult result = policy.evaluate(instance, context);

            assertThat(result.isAllowed()).isTrue();
            assertThat(result.getDenyReason()).isNull();
        }

        @Test
        void should_applyToAllEntityTypes_when_entityTypeIsWildcard() {
            assertThat(policy.entityType()).isEqualTo("*");
        }

        @Test
        void should_applyToRequestClarificationAction() {
            assertThat(policy.action()).isEqualTo(WorkflowAction.REQUEST_CLARIFICATION);
        }
    }

    // ─── DeclarationApprovalPolicy ────────────────────────────────────────────

    @Nested
    class DeclarationApprovalPolicyTests {

        private final DeclarationApprovalPolicy policy = new DeclarationApprovalPolicy();

        @Test
        void should_denyApproval_when_siteVisitFailed() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .subStatus("VERIFICATION_FAILED")
                .build();
            ActionContext context = ActionContext.builder().actorRole("DC").build();

            PolicyResult result = policy.evaluate(instance, context);

            assertThat(result.isAllowed()).isFalse();
            assertThat(result.getDenyReason()).contains("site visit verification has failed");
        }

        @Test
        void should_allowApproval_when_subStatusIsNull() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .subStatus(null)
                .build();
            ActionContext context = ActionContext.builder().actorRole("DC").build();

            PolicyResult result = policy.evaluate(instance, context);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_allowApproval_when_subStatusIsPhysicallyVerified() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .subStatus("PHYSICALLY_VERIFIED")
                .build();
            ActionContext context = ActionContext.builder().actorRole("DC").build();

            PolicyResult result = policy.evaluate(instance, context);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_applyToDeclarationEntityType() {
            assertThat(policy.entityType()).isEqualTo("DECLARATION");
        }

        @Test
        void should_applyToApproveAction() {
            assertThat(policy.action()).isEqualTo(WorkflowAction.APPROVE);
        }
    }

    // ─── DeclarationUniqueSubmissionPolicy ───────────────────────────────────

    @Nested
    @ExtendWith(MockitoExtension.class)
    class DeclarationUniqueSubmissionPolicyTests {

        @Mock
        WorkflowInstanceRepository instanceRepo;

        @InjectMocks
        DeclarationUniqueSubmissionPolicy policy;

        private ActionContext dcContext;

        @BeforeEach
        void setUp() {
            dcContext = ActionContext.builder().actorRole("DC").build();
        }

        @Test
        void should_allowSubmission_when_noOtherPendingDeclarationForSameYear() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.DRAFT)
                .metadataJson("{\"financialYear\":\"2024-25\"}")
                .build();
            instance.setId(100L);

            // No other instances
            when(instanceRepo.findByTempleIdAndEntityType(10L, WorkflowEntityType.DECLARATION))
                .thenReturn(List.of(instance));

            PolicyResult result = policy.evaluate(instance, dcContext);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_denySubmission_when_anotherDeclarationForSameYearIsPending() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.DRAFT)
                .metadataJson("{\"financialYear\":\"2024-25\"}")
                .build();
            instance.setId(100L);

            // Another pending instance with same metadata
            WorkflowInstance pending = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.SUBMITTED)  // isPendingDcAction = true
                .metadataJson("{\"financialYear\":\"2024-25\"}")
                .build();
            pending.setId(200L);  // Different ID

            when(instanceRepo.findByTempleIdAndEntityType(10L, WorkflowEntityType.DECLARATION))
                .thenReturn(List.of(instance, pending));

            PolicyResult result = policy.evaluate(instance, dcContext);

            assertThat(result.isAllowed()).isFalse();
            assertThat(result.getDenyReason()).contains("financial year");
            assertThat(result.getDenyReason()).contains("pending review");
        }

        @Test
        void should_allowSubmission_when_existingDeclarationIsNotPending() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.DRAFT)
                .metadataJson("{\"financialYear\":\"2024-25\"}")
                .build();
            instance.setId(100L);

            // An approved instance — not pending DC action
            WorkflowInstance approved = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.APPROVED)  // isPendingDcAction = false
                .metadataJson("{\"financialYear\":\"2024-25\"}")
                .build();
            approved.setId(200L);

            when(instanceRepo.findByTempleIdAndEntityType(10L, WorkflowEntityType.DECLARATION))
                .thenReturn(List.of(instance, approved));

            PolicyResult result = policy.evaluate(instance, dcContext);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_allowSubmission_when_metadataJsonIsNull() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.DRAFT)
                .metadataJson(null)  // No metadata — skip check
                .build();
            instance.setId(100L);

            PolicyResult result = policy.evaluate(instance, dcContext);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_allowSubmission_when_metadataJsonHasNoFinancialYear() {
            WorkflowInstance instance = WorkflowInstance.builder()
                .entityType(WorkflowEntityType.DECLARATION)
                .templeId(10L)
                .status(WorkflowStatus.DRAFT)
                .metadataJson("{\"someOtherField\":\"value\"}")  // No financialYear key
                .build();
            instance.setId(100L);

            PolicyResult result = policy.evaluate(instance, dcContext);

            assertThat(result.isAllowed()).isTrue();
        }

        @Test
        void should_applyToDeclarationEntityType() {
            assertThat(policy.entityType()).isEqualTo("DECLARATION");
        }

        @Test
        void should_applyToSubmitAction() {
            assertThat(policy.action()).isEqualTo(WorkflowAction.SUBMIT);
        }
    }
}
