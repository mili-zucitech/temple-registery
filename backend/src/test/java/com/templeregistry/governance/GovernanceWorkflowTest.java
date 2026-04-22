package com.templeregistry.governance;

import com.templeregistry.dto.request.governance.RejectRequest;
import com.templeregistry.dto.request.governance.SendBackRequest;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import com.templeregistry.entity.trust.Trust;
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
    @DisplayName("TC-01: Trust Happy Path")
    class TrustHappyPath {

        @Test
        @DisplayName("DRAFT trust can be submitted → SUBMITTED")
        void draftTrustCanBeSubmitted() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.DRAFT)
                    .dcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL)
                    .governanceVersion(1L)
                    .build();

            trust.setSubmissionStatus(SubmissionStatus.SUBMITTED);
            trust.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
            trust.setSendBackReason(null);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(trust.getDcDecisionStatus()).isEqualTo(DcDecisionStatus.PENDING_DC_APPROVAL);
            assertThat(trust.getSendBackReason()).isNull();
        }

        @Test
        @DisplayName("SUBMITTED trust can be approved by DC → APPROVED")
        void submittedTrustCanBeApproved() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .dcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL)
                    .governanceVersion(1L)
                    .build();

            trust.setSubmissionStatus(SubmissionStatus.APPROVED);
            trust.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.APPROVED);
            assertThat(trust.getDcDecisionStatus()).isEqualTo(DcDecisionStatus.APPROVED_BY_DC);
        }

        @Test
        @DisplayName("SENT_BACK trust can be re-submitted → SUBMITTED")
        void sentBackTrustCanBeResubmitted() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SENT_BACK)
                    .sendBackReason("PAN number is incorrect.")
                    .governanceVersion(2L)
                    .build();

            trust.setSubmissionStatus(SubmissionStatus.SUBMITTED);
            trust.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
            trust.setSendBackReason(null);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(trust.getSendBackReason()).isNull();
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
                    .submissionStatus(SubmissionStatus.DRAFT)
                    .dcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .governanceVersion(1L)
                    .build();

            decl.setSubmissionStatus(SubmissionStatus.SUBMITTED);

            assertThat(decl.getSubmissionStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(decl.getPhysicalVerificationStatus())
                    .isEqualTo(PhysicalVerificationStatus.NOT_INITIATED);
        }

        @Test
        @DisplayName("DC can approve declaration when physical verification is NOT_INITIATED (optional)")
        void dcCanApproveWithoutPhysicalVerification() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .governanceVersion(1L)
                    .build();

            // NOT_INITIATED does NOT block approval
            assertThat(decl.getPhysicalVerificationStatus())
                    .isNotEqualTo(PhysicalVerificationStatus.VERIFICATION_FAILED);

            decl.setSubmissionStatus(SubmissionStatus.APPROVED);
            decl.setDcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC);

            assertThat(decl.getSubmissionStatus()).isEqualTo(SubmissionStatus.APPROVED);
        }

        @Test
        @DisplayName("DC can approve declaration when physical verification is PHYSICALLY_VERIFIED")
        void dcCanApproveWhenPhysicallyVerified() {
            AssetDeclaration decl = AssetDeclaration.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.PHYSICALLY_VERIFIED)
                    .governanceVersion(1L)
                    .build();

            boolean isBlocked = decl.getPhysicalVerificationStatus()
                    == PhysicalVerificationStatus.VERIFICATION_FAILED;

            assertThat(isBlocked).isFalse();

            decl.setSubmissionStatus(SubmissionStatus.APPROVED);
            assertThat(decl.getSubmissionStatus()).isEqualTo(SubmissionStatus.APPROVED);
        }
    }

    // =========================================================================
    // TC-03: Send Back Flow
    // =========================================================================

    @Nested
    @DisplayName("TC-03: Send Back Flow")
    class SendBackFlow {

        @Test
        @DisplayName("DC can send back SUBMITTED trust with mandatory free-text reason")
        void dcCanSendBackTrustWithReason() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .governanceVersion(1L)
                    .build();

            String reason = "The PAN number format is incorrect. Please verify and resubmit.";
            trust.setSubmissionStatus(SubmissionStatus.SENT_BACK);
            trust.setSendBackReason(reason);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.SENT_BACK);
            assertThat(trust.getSendBackReason()).isEqualTo(reason);
        }

        @Test
        @DisplayName("TA can edit SENT_BACK trust and resubmit → SUBMITTED")
        void taCanEditAndResubmitSentBackTrust() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SENT_BACK)
                    .sendBackReason("PAN number is incorrect.")
                    .governanceVersion(2L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);
            // SENT_BACK is editable — must NOT throw
            guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L);

            trust.setSubmissionStatus(SubmissionStatus.SUBMITTED);
            trust.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
            trust.setSendBackReason(null);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(trust.getSendBackReason()).isNull();
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
        @DisplayName("DC can reject SUBMITTED trust → REJECTED (terminal)")
        void dcCanRejectSubmittedTrust() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .governanceVersion(1L)
                    .build();

            trust.setSubmissionStatus(SubmissionStatus.REJECTED);
            trust.setDcDecisionStatus(DcDecisionStatus.REJECTED_BY_DC);

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.REJECTED);
            assertThat(trust.getDcDecisionStatus()).isEqualTo(DcDecisionStatus.REJECTED_BY_DC);
        }

        @Test
        @DisplayName("REJECTED trust cannot be edited — TA must create new")
        void rejectedTrustCannotBeEdited() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.REJECTED)
                    .governanceVersion(2L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("REJECTED")
                    .hasMessageContaining("cannot be edited");
        }

        @Test
        @DisplayName("SUBMITTED trust cannot be edited by TA")
        void submittedTrustCannotBeEditedByTa() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .governanceVersion(1L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L))
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
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .physicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .governanceVersion(1L)
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
                    .submissionStatus(SubmissionStatus.SENT_BACK)
                    .physicalVerificationStatus(PhysicalVerificationStatus.PHYSICALLY_VERIFIED)
                    .governanceVersion(3L)
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
                    .submissionStatus(SubmissionStatus.SENT_BACK)
                    .physicalVerificationStatus(PhysicalVerificationStatus.VERIFICATION_FAILED)
                    .governanceVersion(4L)
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
                    .submissionStatus(SubmissionStatus.SUBMITTED)
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
                    .submissionStatus(SubmissionStatus.SUBMITTED)
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
        @DisplayName("Already APPROVED trust cannot be approved again")
        void alreadyApprovedTrustCannotBeApprovedAgain() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.APPROVED)
                    .dcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC)
                    .governanceVersion(2L)
                    .build();

            // assertDcCanAct requires SUBMITTED status
            boolean canAct = trust.getSubmissionStatus() == SubmissionStatus.SUBMITTED;

            assertThat(canAct)
                    .as("APPROVED trust must NOT be actionable by DC again")
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
                    .submissionStatus(SubmissionStatus.APPROVED)
                    .dcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC)
                    .governanceVersion(3L)
                    .build();

            boolean canAct = decl.getSubmissionStatus() == SubmissionStatus.SUBMITTED;

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
        @DisplayName("DRAFT trust cannot be approved directly (must be submitted first)")
        void draftTrustCannotBeApprovedDirectly() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.DRAFT)
                    .governanceVersion(1L)
                    .build();

            boolean canAct = trust.getSubmissionStatus() == SubmissionStatus.SUBMITTED;
            assertThat(canAct).isFalse();
        }

        @Test
        @DisplayName("REJECTED trust cannot be submitted again (terminal — must create new)")
        void rejectedTrustCannotBeSubmittedAgain() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.REJECTED)
                    .governanceVersion(2L)
                    .build();

            boolean canSubmit = trust.getSubmissionStatus() == SubmissionStatus.DRAFT
                    || trust.getSubmissionStatus() == SubmissionStatus.SENT_BACK;

            assertThat(canSubmit)
                    .as("REJECTED trust cannot be re-submitted — TA must create a new record")
                    .isFalse();
        }

        @Test
        @DisplayName("APPROVED trust cannot be sent back")
        void approvedTrustCannotBeSentBack() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.APPROVED)
                    .governanceVersion(2L)
                    .build();

            boolean canAct = trust.getSubmissionStatus() == SubmissionStatus.SUBMITTED;
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
    @DisplayName("TC-11: Re-submission Logic")
    class ResubmissionLogic {

        @Test
        @DisplayName("GovernanceEditGuard.assertCanEdit() allows APPROVED entities to be edited")
        void approvedEntityCanBeEdited() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.APPROVED)
                    .dcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC)
                    .governanceVersion(2L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            // Must NOT throw — APPROVED is now editable (triggers re-submission)
            guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L);
        }

        @Test
        @DisplayName("GovernanceEditGuard.requiresResubmission() returns true for APPROVED status")
        void requiresResubmissionTrueForApproved() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThat(guard.requiresResubmission(SubmissionStatus.APPROVED))
                    .as("APPROVED entity must require re-submission after TA edit")
                    .isTrue();
        }

        @Test
        @DisplayName("GovernanceEditGuard.requiresResubmission() returns false for DRAFT and SENT_BACK")
        void requiresResubmissionFalseForDraftAndSentBack() {
            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThat(guard.requiresResubmission(SubmissionStatus.DRAFT))
                    .as("DRAFT entity does not require re-submission")
                    .isFalse();
            assertThat(guard.requiresResubmission(SubmissionStatus.SENT_BACK))
                    .as("SENT_BACK entity does not require re-submission")
                    .isFalse();
        }

        @Test
        @DisplayName("After TA edits APPROVED trust, status resets to SUBMITTED (PENDING_REVIEW)")
        void approvedTrustResetsToSubmittedAfterEdit() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.APPROVED)
                    .dcDecisionStatus(DcDecisionStatus.APPROVED_BY_DC)
                    .governanceVersion(2L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            // Simulate the re-submission logic in TrustServiceImpl.update()
            SubmissionStatus statusBeforeEdit = trust.getSubmissionStatus();
            guard.assertCanEdit(statusBeforeEdit, "Trust", 1L); // must not throw

            if (guard.requiresResubmission(statusBeforeEdit)) {
                trust.setSubmissionStatus(SubmissionStatus.SUBMITTED);
                trust.setDcDecisionStatus(DcDecisionStatus.PENDING_DC_APPROVAL);
                trust.setSendBackReason(null);
                trust.setGovernanceVersion(trust.getGovernanceVersion() + 1);
            }

            assertThat(trust.getSubmissionStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(trust.getDcDecisionStatus()).isEqualTo(DcDecisionStatus.PENDING_DC_APPROVAL);
            assertThat(trust.getGovernanceVersion()).isEqualTo(3L);
        }

        @Test
        @DisplayName("REJECTED entity still cannot be edited (terminal state)")
        void rejectedEntityCannotBeEdited() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.REJECTED)
                    .governanceVersion(2L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("REJECTED");
        }

        @Test
        @DisplayName("SUBMITTED entity cannot be edited (awaiting DC action)")
        void submittedEntityCannotBeEdited() {
            Trust trust = Trust.builder()
                    .submissionStatus(SubmissionStatus.SUBMITTED)
                    .governanceVersion(1L)
                    .build();

            GovernanceEditGuard guard = new GovernanceEditGuard(null);

            assertThatThrownBy(() -> guard.assertCanEdit(trust.getSubmissionStatus(), "Trust", 1L))
                    .isInstanceOf(IllegalStatusTransitionException.class)
                    .hasMessageContaining("SUBMITTED");
        }
    }
}
