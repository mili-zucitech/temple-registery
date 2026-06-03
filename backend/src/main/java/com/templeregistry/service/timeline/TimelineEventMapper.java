package com.templeregistry.service.timeline;

import com.templeregistry.entity.timeline.TimelineEventCode;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.event.workflow.GovernanceDomainEvent;

/**
 * Centralised mapping utility: (entityType, action) → (TimelineEventCode, title, description).
 *
 * DO NOT scatter label logic in listeners or service implementations.
 * All display-related mapping belongs here so the frontend event_code table
 * and this class remain the single sources of truth.
 *
 * Frontend relies on {@code event_code} for icons and colours.
 * {@code title} / {@code description} are backend-generated fallbacks.
 */
public final class TimelineEventMapper {

    private TimelineEventMapper() {}

    /**
     * Immutable label pair returned to the service.
     */
    public record EventLabels(String title, String description) {}

    // ─── Code Resolution ──────────────────────────────────────────────────────

    public static TimelineEventCode resolveCode(GovernanceDomainEvent event) {
        WorkflowAction action = event.action();
        WorkflowEntityType entityType = event.entityType();

        if (action == null || entityType == null) {
            return TimelineEventCode.GENERIC_EVENT;
        }

        return switch (entityType) {
            case TEMPLE_PROFILE   -> resolveProfileCode(action);
            case DECLARATION      -> resolveDeclarationCode(action);
            case TRUST            -> resolveTrustCode(action);
            case BOARD_MEMBER     -> resolveBoardMemberCode(action);
            case EMPLOYEE         -> resolveStaffCode(action);
            case CONTRACTOR       -> resolveContractorCode(action);
            default               -> resolveGenericCode(action);
        };
    }

    private static TimelineEventCode resolveProfileCode(WorkflowAction action) {
        return switch (action) {
            case SYSTEM_INITIATE  -> TimelineEventCode.PROFILE_CREATED;
            case SUBMIT           -> TimelineEventCode.PROFILE_SUBMITTED;
            case RESUBMIT         -> TimelineEventCode.PROFILE_RESUBMITTED;
            case APPROVE,
                 VERIFY_TEMPLE_PROFILE -> TimelineEventCode.PROFILE_APPROVED;
            case RE_APPROVE       -> TimelineEventCode.PROFILE_APPROVED;
            case REJECT           -> TimelineEventCode.PROFILE_REJECTED;
            case BEGIN_REVIEW     -> TimelineEventCode.PROFILE_UNDER_REVIEW;
            case REQUEST_CLARIFICATION,
                 FLAG_TEMPLE_PROFILE,
                 SEND_BACK        -> TimelineEventCode.PROFILE_CLARIFICATION_REQUESTED;
            case RESPOND_CLARIFICATION -> TimelineEventCode.PROFILE_CLARIFICATION_RESPONDED;
            case WITHDRAW         -> TimelineEventCode.PROFILE_WITHDRAWN;
            case EDIT_APPROVED    -> TimelineEventCode.PROFILE_UPDATED;
            case AUTO_SUPERSEDE   -> TimelineEventCode.SYSTEM_AUTO_SUPERSEDED;
            case ESCALATE         -> TimelineEventCode.SYSTEM_ESCALATED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveDeclarationCode(WorkflowAction action) {
        return switch (action) {
            case SUBMIT           -> TimelineEventCode.DECLARATION_SUBMITTED;
            case RESUBMIT         -> TimelineEventCode.DECLARATION_RESUBMITTED;
            case APPROVE, RE_APPROVE -> TimelineEventCode.DECLARATION_APPROVED;
            case REJECT           -> TimelineEventCode.DECLARATION_REJECTED;
            case BEGIN_REVIEW     -> TimelineEventCode.DECLARATION_UNDER_REVIEW;
            case REQUEST_CLARIFICATION,
                 SEND_BACK        -> TimelineEventCode.DECLARATION_CLARIFICATION_REQUESTED;
            case RESPOND_CLARIFICATION -> TimelineEventCode.DECLARATION_CLARIFICATION_RESPONDED;
            case SCHEDULE_SITE_VISIT   -> TimelineEventCode.DECLARATION_SITE_VISIT_SCHEDULED;
            case COMPLETE_SITE_VISIT   -> TimelineEventCode.DECLARATION_SITE_VISIT_COMPLETED;
            case WITHDRAW              -> TimelineEventCode.DECLARATION_WITHDRAWN;
            case AUTO_SUPERSEDE        -> TimelineEventCode.DECLARATION_SUPERSEDED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveTrustCode(WorkflowAction action) {
        return switch (action) {
            case SUBMIT           -> TimelineEventCode.TRUST_SUBMITTED;
            case RESUBMIT         -> TimelineEventCode.TRUST_RESUBMITTED;
            case APPROVE, RE_APPROVE -> TimelineEventCode.TRUST_APPROVED;
            case REJECT           -> TimelineEventCode.TRUST_REJECTED;
            case BEGIN_REVIEW     -> TimelineEventCode.TRUST_UNDER_REVIEW;
            case REQUEST_CLARIFICATION, SEND_BACK -> TimelineEventCode.TRUST_CLARIFICATION_REQUESTED;
            case RESPOND_CLARIFICATION -> TimelineEventCode.TRUST_CLARIFICATION_RESPONDED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveBoardMemberCode(WorkflowAction action) {
        return switch (action) {
            case SUBMIT           -> TimelineEventCode.BOARD_MEMBER_SUBMITTED;
            case APPROVE, RE_APPROVE -> TimelineEventCode.BOARD_MEMBER_APPROVED;
            case REJECT           -> TimelineEventCode.BOARD_MEMBER_REJECTED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveStaffCode(WorkflowAction action) {
        return switch (action) {
            case SUBMIT           -> TimelineEventCode.STAFF_SUBMITTED;
            case APPROVE, RE_APPROVE -> TimelineEventCode.STAFF_APPROVED;
            case REJECT           -> TimelineEventCode.STAFF_REJECTED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveContractorCode(WorkflowAction action) {
        return switch (action) {
            case SUBMIT           -> TimelineEventCode.CONTRACTOR_SUBMITTED;
            case APPROVE, RE_APPROVE -> TimelineEventCode.CONTRACTOR_APPROVED;
            case REJECT           -> TimelineEventCode.CONTRACTOR_REJECTED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    private static TimelineEventCode resolveGenericCode(WorkflowAction action) {
        return switch (action) {
            case SYSTEM_INITIATE  -> TimelineEventCode.SYSTEM_INITIATED;
            case AUTO_SUPERSEDE   -> TimelineEventCode.SYSTEM_AUTO_SUPERSEDED;
            case ESCALATE         -> TimelineEventCode.SYSTEM_ESCALATED;
            case FLAG_OVERDUE     -> TimelineEventCode.SYSTEM_OVERDUE_FLAGGED;
            default               -> TimelineEventCode.GENERIC_EVENT;
        };
    }

    // ─── Label Resolution ─────────────────────────────────────────────────────

    public static EventLabels resolveLabels(TimelineEventCode code, GovernanceDomainEvent event) {
        String moduleFriendly = moduleLabel(event.entityType());
        String fromStatus = event.fromStatus() != null ? friendlyStatus(event.fromStatus().name()) : null;
        String toStatus   = event.toStatus()   != null ? friendlyStatus(event.toStatus().name())   : null;

        return switch (code) {
            // Temple Profile
            case PROFILE_CREATED   -> new EventLabels("Temple Profile Created",
                "The temple profile record was initialised in DRAFT state.");
            case PROFILE_SUBMITTED -> new EventLabels("Temple Profile Submitted",
                "Temple profile submitted for District Collector review.");
            case PROFILE_APPROVED  -> new EventLabels("Temple Profile Approved",
                "Temple profile was approved by the District Collector.");
            case PROFILE_REJECTED  -> new EventLabels("Temple Profile Rejected",
                "Temple profile submission was rejected by the District Collector.");
            case PROFILE_RESUBMITTED -> new EventLabels("Temple Profile Resubmitted",
                "Updated temple profile resubmitted for review.");
            case PROFILE_UPDATED   -> new EventLabels("Temple Profile Updated",
                "An approved temple profile was edited and placed under review.");
            case PROFILE_UNDER_REVIEW -> new EventLabels("Profile Under Review",
                "District Collector has started reviewing the temple profile.");
            case PROFILE_CLARIFICATION_REQUESTED -> new EventLabels("Clarification Requested",
                "District Collector requested clarification on the temple profile.");
            case PROFILE_CLARIFICATION_RESPONDED -> new EventLabels("Clarification Responded",
                "Temple authority responded to the clarification request.");
            case PROFILE_WITHDRAWN -> new EventLabels("Profile Withdrawn",
                "Temple authority withdrew the profile submission.");

            // Declaration
            case DECLARATION_SUBMITTED -> new EventLabels("Declaration Submitted",
                "Asset declaration submitted for review.");
            case DECLARATION_APPROVED  -> new EventLabels("Declaration Approved",
                "Asset declaration was approved and an acknowledgement number was issued.");
            case DECLARATION_REJECTED  -> new EventLabels("Declaration Rejected",
                "Asset declaration was rejected by the District Collector.");
            case DECLARATION_RESUBMITTED -> new EventLabels("Declaration Resubmitted",
                "Updated declaration resubmitted for review.");
            case DECLARATION_UNDER_REVIEW -> new EventLabels("Declaration Under Review",
                "District Collector has started reviewing the declaration.");
            case DECLARATION_CLARIFICATION_REQUESTED -> new EventLabels("Clarification Requested",
                "District Collector requested clarification on the declaration.");
            case DECLARATION_CLARIFICATION_RESPONDED -> new EventLabels("Clarification Responded",
                "Temple authority responded to the declaration clarification.");
            case DECLARATION_SITE_VISIT_SCHEDULED -> new EventLabels("Site Visit Scheduled",
                "A physical verification visit has been scheduled.");
            case DECLARATION_SITE_VISIT_COMPLETED -> new EventLabels("Site Visit Completed",
                "Physical verification visit has been completed.");
            case DECLARATION_WITHDRAWN -> new EventLabels("Declaration Withdrawn",
                "Temple authority withdrew the declaration submission.");
            case DECLARATION_SUPERSEDED -> new EventLabels("Declaration Superseded",
                "This declaration version was superseded by a newer approved version.");

            // Trust
            case TRUST_SUBMITTED   -> new EventLabels("Trust Submitted", "Trust record submitted for review.");
            case TRUST_APPROVED    -> new EventLabels("Trust Approved", "Trust record was approved.");
            case TRUST_REJECTED    -> new EventLabels("Trust Rejected", "Trust record was rejected.");
            case TRUST_RESUBMITTED -> new EventLabels("Trust Resubmitted", "Updated trust resubmitted for review.");
            case TRUST_UNDER_REVIEW -> new EventLabels("Trust Under Review", "DC is reviewing the trust record.");
            case TRUST_CLARIFICATION_REQUESTED -> new EventLabels("Clarification Requested",
                "DC requested clarification on the trust record.");
            case TRUST_CLARIFICATION_RESPONDED -> new EventLabels("Clarification Responded",
                "Temple authority responded to the trust clarification.");

            // Board Member
            case BOARD_MEMBER_SUBMITTED -> new EventLabels("Board Member Submitted",
                "Board member details submitted for review.");
            case BOARD_MEMBER_APPROVED  -> new EventLabels("Board Member Approved",
                "Board member details were approved.");
            case BOARD_MEMBER_REJECTED  -> new EventLabels("Board Member Rejected",
                "Board member details were rejected.");

            // Staff
            case STAFF_SUBMITTED -> new EventLabels("Staff Record Submitted", "Staff record submitted for review.");
            case STAFF_APPROVED  -> new EventLabels("Staff Record Approved", "Staff record was approved.");
            case STAFF_REJECTED  -> new EventLabels("Staff Record Rejected", "Staff record was rejected.");

            // Contractor
            case CONTRACTOR_SUBMITTED -> new EventLabels("Contractor Record Submitted",
                "Contractor record submitted for review.");
            case CONTRACTOR_APPROVED  -> new EventLabels("Contractor Record Approved",
                "Contractor record was approved.");
            case CONTRACTOR_REJECTED  -> new EventLabels("Contractor Record Rejected",
                "Contractor record was rejected.");

            // Documents
            case DOCUMENT_UPLOADED -> new EventLabels("Document Uploaded", "A document was uploaded.");
            case DOCUMENT_DELETED  -> new EventLabels("Document Removed", "A document was removed.");

            // System
            case SYSTEM_INITIATED       -> new EventLabels("Workflow Initiated",
                moduleFriendly + " workflow was initialised.");
            case SYSTEM_AUTO_SUPERSEDED -> new EventLabels("Version Superseded",
                "A previous approved version was superseded by a newer approval.");
            case SYSTEM_ESCALATED       -> new EventLabels("Escalated",
                "This submission was escalated due to repeated delays.");
            case SYSTEM_OVERDUE_FLAGGED -> new EventLabels("Marked Overdue",
                "Submission has been flagged as overdue by the system scheduler.");

            default -> new EventLabels(
                toStatus != null ? "Status changed to " + toStatus : "Activity recorded",
                fromStatus != null && toStatus != null
                    ? moduleFriendly + " status changed from " + fromStatus + " to " + toStatus + "."
                    : "An event was recorded for this temple."
            );
        };
    }

    // ─── Formatting Helpers ───────────────────────────────────────────────────

    private static String moduleLabel(WorkflowEntityType type) {
        if (type == null) return "Record";
        return switch (type) {
            case TEMPLE_PROFILE -> "Temple profile";
            case DECLARATION    -> "Declaration";
            case TRUST          -> "Trust";
            case BOARD_MEMBER   -> "Board member";
            case EMPLOYEE       -> "Staff";
            case CONTRACTOR     -> "Contractor";
            default             -> type.name().replace("_", " ").toLowerCase();
        };
    }

    private static String friendlyStatus(String status) {
        if (status == null) return null;
        return status.replace("_", " ").toLowerCase();
    }
}
