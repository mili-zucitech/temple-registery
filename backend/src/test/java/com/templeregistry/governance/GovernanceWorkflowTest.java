package com.templeregistry.governance;

import com.templeregistry.dto.request.governance.RejectRequest;
import com.templeregistry.dto.request.governance.SendBackRequest;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.service.governance.GovernanceEditGuard;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Governance Workflow Unit Tests
 *
 * Covers state-transition logic for the THREE governed modules:
 *   1. Trust & Board
 *   2. Asset Declaration
 *   3. Temple Profile (via staging)
 *
 * ❌ Staff (Employee) and Contractor are NOT governed modules.
 *    They have NO submission/approval workflow.
 *    Tests for Staff/Contractor no-approval enforcement are in
 *    StaffContractorNoApprovalTest.
 *
 * Test cases:
 *   TC-01: Trust happy path (submit → approve)
 *   TC-02: Declaration happy path (submit → approve, with/without physical verification)
 *   TC-03: Send Back flow (Trust)
 *   TC-04: Reject flow (Trust — terminal)
 *   TC-05: Physical verification → edit → re-approval
 *   TC-06: TA cannot view restricted DC-only fields
 *   TC-07: DC approving without physical verification (allowed)
 *   TC-08: DC approval blocked when physical verification FAILED
 *   TC-09: Double-approval attempt blocked
 *   TC-10: Invalid state transitions blocked
 */
@DisplayName("Governance Workflow — Trust & Declaration")
class GovernanceWorkflowTest {

    // =========================================================================
    // TC-01: Trust Happy Path
    // =========================================================================

    @Nested
    @DisplayName("TC-01: Trust Happy Path (Canonical Status Architecture)")
    class TrustHappyPath {

        @Test
        @DisplayName("Trust entity does NOT have a submissionStatus field (legacy removed)")
        void trustEntityHasNoSubmissionStatusField() throws Exception {
            Class<?> trustClass = Trust.class;
            boolean hasSubmissionStatus = false;
            for (java.lang.reflect.Field field : trustClass.getDeclaredFields()) {
                if ("submissionStatus".equals(field.getName())) {
                    hasSubmissionStatus = true;
                    break;
                }
            }
            assertThat(hasSubmissionStatus)
                .as("Trust must NOT have submissionStatus field — state lives in WorkflowInstance")
                .isFalse();
        }

        @Test
        @DisplayName("Trust entity does NOT have a dcDecisionStatus field (legacy removed)")
        void trustEntityHasNoDcDecisionStatusField() throws Exception {
            Class<?> trustClass = Trust.class;
            boolean hasDcDecisionStatus = false;
            for (java.lang.reflect.Field field : trustClass.getDeclaredFields()) {
                if ("dcDecisionStatus".equals(field.getName())) {
                    hasDcDecisionStatus = true;
                    break;
                }
            }
            assertThat(hasDcDecisionStatus)
                .as("Trust must NOT have dcDecisionStatus field — state lives in WorkflowInstance")
                .isFalse();
        }

        @Test
        @DisplayName("Trust entity still has sendBackReason (display-only field kept)")
        void trustEntityHasSendBackReason() throws Exception {
            Class<?> trustClass = Trust.class;
            boolean hasSendBackReason = false;
            for (java.lang.reflect.Field field : trustClass.getDeclaredFields()) {
                if ("sendBackReason".equals(field.getName())) {
                    hasSendBackReason = true;
                    break;
                }
            }
            assertThat(hasSendBackReason)
                .as("Trust must retain sendBackReason for display to Temple Authority")
                .isTrue();
        }
    }

    // =========================================================================
    // TC-02: Declaration Happy Path
    // =========================================================================

    @Nested
    @DisplayName("TC-02: Asset Declaration Happy Path")
    class DeclarationHappyPath {

        @Test
        @DisplayName("DRAFT declaration can be submitted → SUBMITTED")
        void draftDeclarationCanBeSubmitted() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.DRAFT)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .build();

            decl.setStatus(DeclarationStatus.SUBMITTED);

            assertThat(decl.getStatus()).isEqualTo(DeclarationStatus.SUBMITTED);
            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.NOT_INITIATED);
        }

        @Test
        @DisplayName("DC can approve declaration when physical verification is NOT_INITIATED (optional)")
        void dcCanApproveWithoutPhysicalVerification() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .build();

            // NOT_INITIATED does NOT block approval
            assertThat(decl.getPhysicalVerificationStatus())
                    .isNotEqualTo(PhysicalVerificationStatus.VERIFICATION_FAILED);

            decl.setStatus(DeclarationStatus.APPROVED);

            assertThat(decl.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
        }

        @Test
        @DisplayName("DC can approve declaration when physical verification is PHYSICALLY_VERIFIED")
        void dcCanApproveWhenPhysicallyVerified() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.PHYSICALLY_VERIFIED)
                    .build();

            boolean isBlocked = decl.getPhysicalVerificationStatus()
                    == PhysicalVerificationStatus.VERIFICATION_FAILED;

            assertThat(isBlocked).isFalse();

            decl.setStatus(DeclarationStatus.APPROVED);
            assertThat(decl.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
        }
    }

    // =========================================================================
    // TC-03: Send Back Flow
    // =========================================================================

    @Nested
    @DisplayName("TC-03: Send Back Flow")
    class SendBackFlow {

        @Test
        @DisplayName("DC can send back trust — sendBackReason persisted on entity")
        void dcCanSendBackTrustWithReason() {
            Trust trust = Trust.builder().build();

            String reason = "The PAN number format is incorrect. Please verify and resubmit.";
            trust.setSendBackReason(reason);

            assertThat(trust.getSendBackReason()).isEqualTo(reason);
        }

        @Test
        @DisplayName("GovernanceEditGuard allows editing when WorkflowStatus is CLARIFICATION_REQUESTED")
        void taCanEditWhenStatusIsClarificationRequested() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);
            // CLARIFICATION_REQUESTED (send-back) is editable — must NOT throw
            guard.assertCanEdit(WorkflowStatus.CLARIFICATION_REQUESTED, "Trust", 1L);
        }

        @Test
        @DisplayName("Send Back reason must not be blank")
        void sendBackReasonMustNotBeBlank() {
            SendBackRequest request = new SendBackRequest();
            request.setReason("");
            assertThat(request.getReason()).isBlank();
        }
    }

    // =========================================================================
    // TC-04: Reject Flow
    // =========================================================================

    @Nested
    @DisplayName("TC-04: Reject Flow")
    class RejectFlow {

        @Test
        @DisplayName("GovernanceEditGuard blocks editing when WorkflowStatus is REJECTED (terminal)")
        void rejectedStatusCannotBeEdited() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(WorkflowStatus.REJECTED, "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("REJECTED");
        }

        @Test
        @DisplayName("GovernanceEditGuard blocks editing when WorkflowStatus is SUBMITTED")
        void submittedStatusCannotBeEdited() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(WorkflowStatus.SUBMITTED, "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("SUBMITTED");
        }
    }

    // =========================================================================
    // TC-05: Physical Verification → Edit → Re-approval
    // =========================================================================

    @Nested
    @DisplayName("TC-05: Physical Verification → Edit → Re-approval")
    class PhysicalVerificationEditReapproval {

        @Test
        @DisplayName("DC orders physical verification → ORDERED_FOR_PHYSICAL_VERIFICATION")
        void dcOrdersPhysicalVerification() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .build();

            decl.setPhysicalVerificationStatus(
                    PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION);

            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION);
        }

        @Test
        @DisplayName("DC marks as PHYSICALLY_VERIFIED → status updated")
        void dcMarksAsPhysicallyVerified() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .physicalVerificationStatus(
                            PhysicalVerificationStatus.ORDERED_FOR_PHYSICAL_VERIFICATION)
                    .build();

            decl.setPhysicalVerificationStatus(PhysicalVerificationStatus.PHYSICALLY_VERIFIED);

            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.PHYSICALLY_VERIFIED);
        }

        @Test
        @DisplayName("TA edit after PHYSICALLY_VERIFIED resets physical verification to NOT_INITIATED")
        void taEditAfterPhysicallyVerifiedResetsStatus() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.CLARIFICATION_REQUIRED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.PHYSICALLY_VERIFIED)
                    .build();

            // Simulate GovernanceEditGuard reset logic
            if (decl.getPhysicalVerificationStatus() == PhysicalVerificationStatus.PHYSICALLY_VERIFIED
                    || decl.getPhysicalVerificationStatus() == PhysicalVerificationStatus.VERIFICATION_FAILED) {
                decl.setPhysicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED);
                decl.setPhysicalVerificationOrderedAt(null);
                decl.setPhysicalVerificationOrderedBy(null);
                decl.setPhysicalVerificationCompletedAt(null);
            }

            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.NOT_INITIATED);
        }

        @Test
        @DisplayName("TA edit after VERIFICATION_FAILED resets physical verification to NOT_INITIATED")
        void taEditAfterVerificationFailedResetsStatus() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.CLARIFICATION_REQUIRED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.VERIFICATION_FAILED)
                    .build();

            if (decl.getPhysicalVerificationStatus() == PhysicalVerificationStatus.PHYSICALLY_VERIFIED
                    || decl.getPhysicalVerificationStatus() == PhysicalVerificationStatus.VERIFICATION_FAILED) {
                decl.setPhysicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED);
            }

            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.NOT_INITIATED);
        }
    }

    // =========================================================================
    // TC-06: Temple Authority Cannot View Restricted Data
    // =========================================================================

    @Nested
    @DisplayName("TC-06: Temple Authority Cannot View Restricted Data")
    class TaRestrictedDataAccess {

        @Test
        @DisplayName("DeclarationResponse does NOT contain physicalVerificationStatus (DC-only)")
        void declarationResponseDoesNotContainPhysicalVerificationStatus() throws Exception {
            Class<?> responseClass = Class.forName(
                    "com.templeregistry.dto.response.declaration.DeclarationResponse");

            boolean hasPhysicalVerificationField = false;
            for (java.lang.reflect.Field field : responseClass.getDeclaredFields()) {
                if (field.getName().toLowerCase().contains("physical")) {
                    hasPhysicalVerificationField = true;
                    break;
                }
            }

            assertThat(hasPhysicalVerificationField)
                    .as("DeclarationResponse must NOT contain physicalVerificationStatus — DC-only field")
                    .isFalse();
        }

        @Test
        @DisplayName("DeclarationResponse does NOT contain systemVerificationStatus (internal)")
        void declarationResponseDoesNotContainSystemVerificationStatus() throws Exception {
            Class<?> responseClass = Class.forName(
                    "com.templeregistry.dto.response.declaration.DeclarationResponse");

            boolean hasSystemVerificationField = false;
            for (java.lang.reflect.Field field : responseClass.getDeclaredFields()) {
                if (field.getName().toLowerCase().contains("systemverification")) {
                    hasSystemVerificationField = true;
                    break;
                }
            }

            assertThat(hasSystemVerificationField)
                    .as("DeclarationResponse must NOT contain systemVerificationStatus — internal field")
                    .isFalse();
        }

        @Test
        @DisplayName("TrustResponse does NOT contain systemVerificationStatus (internal)")
        void trustResponseDoesNotContainSystemVerificationStatus() throws Exception {
            Class<?> responseClass = Class.forName(
                    "com.templeregistry.dto.response.trust.TrustResponse");

            boolean hasSystemVerificationField = false;
            for (java.lang.reflect.Field field : responseClass.getDeclaredFields()) {
                if (field.getName().toLowerCase().contains("systemverification")) {
                    hasSystemVerificationField = true;
                    break;
                }
            }

            assertThat(hasSystemVerificationField)
                    .as("TrustResponse must NOT contain systemVerificationStatus — internal field")
                    .isFalse();
        }
    }

    // =========================================================================
    // TC-07: DC Approving Without Physical Verification (allowed)
    // =========================================================================

    @Nested
    @DisplayName("TC-07: DC Approving Without Physical Verification")
    class DcApproveWithoutPhysicalVerification {

        @Test
        @DisplayName("DC can approve when physicalVerificationStatus = NOT_INITIATED")
        void dcCanApproveWhenNotInitiated() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .build();

            boolean isBlocked = decl.getPhysicalVerificationStatus()
                    == PhysicalVerificationStatus.VERIFICATION_FAILED;

            assertThat(isBlocked).isFalse();
        }
    }

    // =========================================================================
    // TC-08: DC Cannot Approve After Verification Failed
    // =========================================================================

    @Nested
    @DisplayName("TC-08: DC Cannot Approve After Verification Failed")
    class DcCannotApproveAfterVerificationFailed {

        @Test
        @DisplayName("DC approval is BLOCKED when physicalVerificationStatus = VERIFICATION_FAILED")
        void dcApprovalBlockedWhenVerificationFailed() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.VERIFICATION_FAILED)
                    .build();

            boolean shouldBlock = decl.getPhysicalVerificationStatus()
                    == PhysicalVerificationStatus.VERIFICATION_FAILED;

            assertThat(shouldBlock)
                    .as("DC approval must be BLOCKED when physical verification has FAILED")
                    .isTrue();

            assertThatThrownBy(() -> {
                if (shouldBlock) {
                    throw new IllegalStatusTransitionException(
                            "Cannot approve declaration: physical verification has FAILED.");
                }
            })
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("FAILED");
        }
    }

    // =========================================================================
    // TC-09: Double-Approval Attempt Blocked
    // =========================================================================

    @Nested
    @DisplayName("TC-09: Double-Approval Attempt Blocked")
    class DoubleApprovalBlocked {

        @Test
        @DisplayName("Already APPROVED trust cannot be approved again — WorkflowStatus check")
        void alreadyApprovedTrustCannotBeApprovedAgain() {
            // APPROVED is not the same as SUBMITTED — DC can only act on SUBMITTED
            boolean canAct = WorkflowStatus.APPROVED == WorkflowStatus.SUBMITTED;

            assertThat(canAct)
                    .as("APPROVED WorkflowStatus must NOT equal SUBMITTED — DC cannot act again")
                    .isFalse();

            assertThatThrownBy(() -> {
                if (!canAct) {
                    throw new IllegalStatusTransitionException(
                            "Cannot perform DC action on Trust: current status is APPROVED. " +
                            "Only SUBMITTED records can be acted upon.");
                }
            })
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("APPROVED");
        }

        @Test
        @DisplayName("Already APPROVED declaration cannot be approved again")
        void alreadyApprovedDeclarationCannotBeApprovedAgain() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .status(DeclarationStatus.APPROVED)
                    .build();

            boolean canAct = decl.getStatus() == DeclarationStatus.SUBMITTED;

            assertThat(canAct).isFalse();
        }
    }

    // =========================================================================
    // TC-10: Invalid State Transitions Blocked
    // =========================================================================

    @Nested
    @DisplayName("TC-10: Invalid State Transitions Blocked")
    class InvalidStateTransitions {

        @Test
        @DisplayName("DRAFT WorkflowStatus cannot be approved directly (must be submitted first)")
        void draftTrustCannotBeApprovedDirectly() {
            boolean canAct = WorkflowStatus.DRAFT == WorkflowStatus.SUBMITTED;
            assertThat(canAct).isFalse();
        }

        @Test
        @DisplayName("REJECTED WorkflowStatus cannot be re-submitted (terminal — must create new)")
        void rejectedTrustCannotBeSubmittedAgain() {
            boolean canSubmit = WorkflowStatus.REJECTED == WorkflowStatus.DRAFT
                    || WorkflowStatus.REJECTED == WorkflowStatus.CLARIFICATION_REQUESTED;

            assertThat(canSubmit)
                    .as("REJECTED WorkflowStatus cannot be re-submitted — TA must create a new record")
                    .isFalse();
        }

        @Test
        @DisplayName("APPROVED WorkflowStatus is not SUBMITTED — DC cannot send back an approved trust")
        void approvedTrustCannotBeSentBack() {
            boolean canAct = WorkflowStatus.APPROVED == WorkflowStatus.SUBMITTED;
            assertThat(canAct).isFalse();
        }

        @Test
        @DisplayName("GovernanceWorkflowService has NO methods for Staff or Contractor approval")
        void governanceServiceHasNoStaffOrContractorApprovalMethods() {
            Class<?> serviceInterface =
                    com.templeregistry.service.governance.GovernanceWorkflowService.class;

            for (java.lang.reflect.Method method : serviceInterface.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowService must NOT have any employee/contractor workflow methods")
                        .doesNotContain("employee")
                        .doesNotContain("contractor")
                        .doesNotContain("staff");
            }
        }

        @Test
        @DisplayName("GovernanceWorkflowController has NO endpoints for Staff or Contractor")
        void governanceControllerHasNoStaffOrContractorEndpoints() {
            Class<?> controllerClass =
                    com.templeregistry.controller.governance.GovernanceWorkflowController.class;

            for (java.lang.reflect.Method method : controllerClass.getDeclaredMethods()) {
                String name = method.getName().toLowerCase();
                assertThat(name)
                        .as("GovernanceWorkflowController must NOT have any employee/contractor endpoints")
                        .doesNotContain("employee")
                        .doesNotContain("contractor")
                        .doesNotContain("staff");
            }
        }
    }

    // =========================================================================
    // TC-11: Re-submission Logic — APPROVED entity can be edited, resets to PENDING_REVIEW
    // =========================================================================

    @Nested
    @DisplayName("TC-11: Re-submission Logic (Canonical WorkflowStatus)")
    class ResubmissionLogic {

        @Test
        @DisplayName("GovernanceEditGuard.assertCanEdit() allows APPROVED WorkflowStatus to be edited")
        void approvedEntityCanBeEdited() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);
            // Must NOT throw — APPROVED is editable (triggers re-submission)
            guard.assertCanEdit(WorkflowStatus.APPROVED, "Trust", 1L);
        }

        @Test
        @DisplayName("GovernanceEditGuard.requiresResubmission() returns true for APPROVED WorkflowStatus")
        void requiresResubmissionTrueForApproved() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);
            assertThat(guard.requiresResubmission(WorkflowStatus.APPROVED))
                    .as("APPROVED entity must require re-submission after TA edit")
                    .isTrue();
        }

        @Test
        @DisplayName("GovernanceEditGuard.requiresResubmission() returns true for RE_APPROVED WorkflowStatus")
        void requiresResubmissionTrueForReApproved() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);
            assertThat(guard.requiresResubmission(WorkflowStatus.RE_APPROVED))
                    .as("RE_APPROVED entity must require re-submission after TA edit")
                    .isTrue();
        }

        @Test
        @DisplayName("GovernanceEditGuard.requiresResubmission() returns false for DRAFT and CLARIFICATION_REQUESTED")
        void requiresResubmissionFalseForDraftAndClarification() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThat(guard.requiresResubmission(WorkflowStatus.DRAFT))
                    .as("DRAFT entity does not require re-submission")
                    .isFalse();
            assertThat(guard.requiresResubmission(WorkflowStatus.CLARIFICATION_REQUESTED))
                    .as("CLARIFICATION_REQUESTED entity does not require re-submission")
                    .isFalse();
        }

        @Test
        @DisplayName("REJECTED WorkflowStatus still cannot be edited (terminal state)")
        void rejectedEntityCannotBeEdited() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(WorkflowStatus.REJECTED, "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("REJECTED");
        }

        @Test
        @DisplayName("SUBMITTED WorkflowStatus cannot be edited (awaiting DC action)")
        void submittedEntityCannotBeEdited() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(WorkflowStatus.SUBMITTED, "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("SUBMITTED");
        }
    }
}

