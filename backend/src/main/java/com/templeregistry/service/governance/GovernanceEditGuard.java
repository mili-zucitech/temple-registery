package com.templeregistry.service.governance;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.PhysicalVerificationStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.repository.governance.PhysicalVerificationHistoryRepository;
import com.templeregistry.entity.governance.PhysicalVerificationHistory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.templeregistry.security.ScopeHelper;

/**
 * Guards and side-effects for TA edit operations on governed entities.
 *
 * Re-submission rules (TASK 3):
 * 1. REJECTED records cannot be edited — TA must create a new one.
 * 2. SUBMITTED records cannot be edited — TA must wait for DC action.
 * 3. APPROVED records CAN be edited — edit resets status to PENDING_REVIEW (re-submission).
 *    This triggers DC notification and requires re-approval.
 * 4. SENT_BACK records CAN be edited (edit does not auto-submit; TA must call submit).
 * 5. DRAFT records can always be edited.
 * 6. For declarations: any edit after PHYSICALLY_VERIFIED or VERIFICATION_FAILED
 *    resets physicalVerificationStatus to NOT_INITIATED.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GovernanceEditGuard {

    private final PhysicalVerificationHistoryRepository physicalVerificationHistoryRepository;

    /**
     * Asserts that a TA can edit a governed entity.
     * Call this before applying any field updates.
     *
     * @param currentStatus current submission status of the entity
     * @param entityType    human-readable entity type for error messages
     * @param entityId      entity ID for error messages
     * @throws IllegalStatusTransitionException if the entity cannot be edited
     */
    public void assertCanEdit(SubmissionStatus currentStatus, String entityType, Long entityId) {
        switch (currentStatus) {
            case REJECTED -> throw new IllegalStatusTransitionException(
                    entityType + " [" + entityId + "] has been REJECTED and cannot be edited. " +
                    "Please create a new " + entityType + " from scratch.");
            case SUBMITTED -> throw new IllegalStatusTransitionException(
                    entityType + " [" + entityId + "] is currently SUBMITTED and awaiting DC review. " +
                    "Editing is not allowed until the DC acts on it.");
            case APPROVED, DRAFT, SENT_BACK -> {
                // APPROVED: allowed — caller must call resetToResubmit() to reset status
                // DRAFT / SENT_BACK: allowed — proceed with edit
            }
        }
    }

    /**
     * Returns true if the entity was APPROVED and needs to be reset to PENDING_REVIEW
     * (re-submission) after a TA edit.
     *
     * Call this AFTER assertCanEdit() and AFTER applying field updates.
     * If this returns true, the caller must:
     *   1. Set submissionStatus = SUBMITTED (PENDING_REVIEW in the new model)
     *   2. Set dcDecisionStatus = PENDING_DC_APPROVAL
     *   3. Clear sendBackReason
     *   4. Notify DC of re-submission
     *
     * @param currentStatus the status BEFORE the edit was applied
     */
    public boolean requiresResubmission(SubmissionStatus currentStatus) {
        return currentStatus == SubmissionStatus.APPROVED;
    }

    /**
     * Handles physical verification reset for Asset Declaration edits.
     *
     * If the declaration was PHYSICALLY_VERIFIED or VERIFICATION_FAILED,
     * any TA edit resets the physical verification status to NOT_INITIATED
     * and records the reset in the audit history.
     *
     * @param declaration the declaration being edited
     * @return true if physical verification was reset (caller should log/notify)
     */
    public boolean handleDeclarationEditPhysicalVerificationReset(AssetDeclaration declaration) {
        PhysicalVerificationStatus current = declaration.getPhysicalVerificationStatus();
        if (current == PhysicalVerificationStatus.PHYSICALLY_VERIFIED
                || current == PhysicalVerificationStatus.VERIFICATION_FAILED) {

            physicalVerificationHistoryRepository.save(PhysicalVerificationHistory.builder()
                    .declarationId(declaration.getId())
                    .dcUserId(currentUserId())
                    .previousStatus(current)
                    .newStatus(PhysicalVerificationStatus.NOT_INITIATED)
                    .notes("Auto-reset: Temple Authority edited the declaration after physical verification.")
                    .build());

            declaration.setPhysicalVerificationStatus(PhysicalVerificationStatus.NOT_INITIATED);
            declaration.setPhysicalVerificationOrderedAt(null);
            declaration.setPhysicalVerificationOrderedBy(null);
            declaration.setPhysicalVerificationCompletedAt(null);

            log.info("Declaration [{}] physical verification reset to NOT_INITIATED after TA edit. " +
                    "Previous status: {}", declaration.getId(), current);
            return true;
        }
        return false;
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }
}
