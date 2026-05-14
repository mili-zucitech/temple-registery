package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowStatus;
import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Static registry of all canonical workflow transition rules.
 *
 * Rules follow: (entityType, fromStatus, action) → toStatus.
 * entityType = "*" = universal (applies to all modules).
 *
 * Module-specific business rules beyond simple transitions
 * are handled by WorkflowPolicy beans — not by adding rules here.
 *
 * No database storage needed — rules are code-level constants.
 */
@Component
public class TransitionRuleRegistry {

    private final List<TransitionRule> rules;

    public TransitionRuleRegistry() {
        this.rules = buildRules();
    }

    public Optional<TransitionRule> find(String entityType, WorkflowStatus from, WorkflowAction action) {
        return rules.stream()
            .filter(r -> r.matches(entityType, from, action))
            .findFirst();
    }

    public List<TransitionRule> findAll() {
        return Collections.unmodifiableList(rules);
    }

    public List<TransitionRule> findAllForStatus(String entityType, WorkflowStatus from) {
        return rules.stream()
            .filter(r -> (r.getEntityType().equals("*") || r.getEntityType().equals(entityType))
                      && r.getFromStatus() == from)
            .collect(java.util.stream.Collectors.toList());
    }

    private List<TransitionRule> buildRules() {
        List<TransitionRule> r = new ArrayList<>();

        // ─── Universal TA Actions ────────────────────────────────────────────
        r.add(rule("*", WorkflowStatus.DRAFT,                    WorkflowAction.SUBMIT,                "TA",     WorkflowStatus.SUBMITTED,             null,                        true));
        r.add(rule("*", WorkflowStatus.UPDATED_AFTER_APPROVAL,   WorkflowAction.RESUBMIT,              "TA",     WorkflowStatus.RESUBMITTED,            null,                        true));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_REQUESTED,  WorkflowAction.RESPOND_CLARIFICATION, "TA",     WorkflowStatus.CLARIFICATION_RESPONDED,null,                        false));
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.WITHDRAW,              "TA",     WorkflowStatus.WITHDRAWN,              null,                        true));
        r.add(rule("*", WorkflowStatus.APPROVED,                 WorkflowAction.EDIT_APPROVED,         "TA",     WorkflowStatus.UPDATED_AFTER_APPROVAL, null,                        true));
        r.add(rule("*", WorkflowStatus.RE_APPROVED,              WorkflowAction.EDIT_APPROVED,         "TA",     WorkflowStatus.UPDATED_AFTER_APPROVAL, null,                        true));
        // Rejected entities can also be edited — same transition, allows TA to fix and resubmit.
        r.add(rule("*", WorkflowStatus.REJECTED,                 WorkflowAction.EDIT_APPROVED,         "TA",     WorkflowStatus.UPDATED_AFTER_APPROVAL, null,                        true));

        // ─── Universal DC Actions ────────────────────────────────────────────
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.BEGIN_REVIEW,          "DC",     WorkflowStatus.UNDER_REVIEW,           null,                        true));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.BEGIN_REVIEW,          "DC",     WorkflowStatus.UNDER_REVIEW,           null,                        true));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.BEGIN_REVIEW,          "DC",     WorkflowStatus.UNDER_REVIEW,           null,                        false));

        // Approve — from multiple states
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.APPROVE,               "DC",     WorkflowStatus.APPROVED,               null,                        true));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.APPROVE,               "DC",     WorkflowStatus.APPROVED,               null,                        true));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.APPROVE,               "DC",     WorkflowStatus.APPROVED,               null,                        true));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.RE_APPROVE,            "DC",     WorkflowStatus.RE_APPROVED,            null,                        true));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.APPROVE,               "DC",     WorkflowStatus.RE_APPROVED,            null,                        true));

        // Reject — from multiple states
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.REJECT,                "DC",     WorkflowStatus.REJECTED,               null,                        true));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.REJECT,                "DC",     WorkflowStatus.REJECTED,               null,                        true));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.REJECT,                "DC",     WorkflowStatus.REJECTED,               null,                        true));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.REJECT,                "DC",     WorkflowStatus.REJECTED,               null,                        true));

        // Reject edit — non-terminal: entity was previously approved and TA edited it.
        // Restores approved data snapshot (handled in service layer before this transition).
        // RESUBMITTED → RE_APPROVED (entity reverts to its last approved state).
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.REJECT_EDIT,           "DC",     WorkflowStatus.RE_APPROVED,            null,                        true));
        // Also handle UNDER_REVIEW state (DC may have marked under-review before rejecting the edit).
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.REJECT_EDIT,           "DC",     WorkflowStatus.RE_APPROVED,            null,                        true));

        // Request clarification — from multiple states
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.REQUEST_CLARIFICATION, "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.REQUEST_CLARIFICATION, "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.REQUEST_CLARIFICATION, "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.REQUEST_CLARIFICATION, "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));

        // Legacy SEND_BACK alias for clarification workflow
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.SEND_BACK,             "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.SEND_BACK,             "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.SEND_BACK,             "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.SEND_BACK,             "DC",     WorkflowStatus.CLARIFICATION_REQUESTED,null,                        false));

        // ─── Declaration-specific sub-state transitions ───────────────────────
        r.add(rule("DECLARATION", WorkflowStatus.UNDER_REVIEW,   WorkflowAction.SCHEDULE_SITE_VISIT,   "DC",     WorkflowStatus.UNDER_REVIEW,           "SITE_VISIT_SCHEDULED",      false));
        r.add(rule("DECLARATION", WorkflowStatus.UNDER_REVIEW,   WorkflowAction.COMPLETE_SITE_VISIT,   "DC",     WorkflowStatus.UNDER_REVIEW,           "SITE_VISIT_COMPLETED",      false));
        r.add(rule("DECLARATION", WorkflowStatus.UNDER_REVIEW,   WorkflowAction.VERIFY_SITE_VISIT,     "DC",     WorkflowStatus.UNDER_REVIEW,           "PHYSICALLY_VERIFIED",       false));
        r.add(rule("DECLARATION", WorkflowStatus.UNDER_REVIEW,   WorkflowAction.FAIL_SITE_VISIT,       "DC",     WorkflowStatus.UNDER_REVIEW,           "VERIFICATION_FAILED",       false));

        // ─── Temple Profile — DC verification actions ────────────────────────
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.SUBMITTED,   WorkflowAction.VERIFY_TEMPLE_PROFILE,   "DC", WorkflowStatus.APPROVED,               null,       true));
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.UNDER_REVIEW,WorkflowAction.VERIFY_TEMPLE_PROFILE,   "DC", WorkflowStatus.APPROVED,               null,       true));
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.SUBMITTED,   WorkflowAction.FLAG_TEMPLE_PROFILE,     "DC", WorkflowStatus.CLARIFICATION_REQUESTED, "FLAGGED",  false));
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.UNDER_REVIEW,WorkflowAction.FLAG_TEMPLE_PROFILE,     "DC", WorkflowStatus.CLARIFICATION_REQUESTED, "FLAGGED",  false));
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.APPROVED,    WorkflowAction.FLAG_TEMPLE_PROFILE,     "DC", WorkflowStatus.CLARIFICATION_REQUESTED, "FLAGGED",  false));
        r.add(rule("TEMPLE_PROFILE", WorkflowStatus.CLARIFICATION_REQUESTED, WorkflowAction.UNFLAG_TEMPLE_PROFILE, "DC", WorkflowStatus.SUBMITTED, null, true));

        // ─── System Actions ──────────────────────────────────────────────────
        // FLAG_OVERDUE: transitions to OVERDUE status (Req 1.6)
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.FLAG_OVERDUE,              "SYSTEM", WorkflowStatus.OVERDUE,                "FLAG_OVERDUE",              false));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.FLAG_OVERDUE,              "SYSTEM", WorkflowStatus.OVERDUE,                "FLAG_OVERDUE",              false));
        r.add(rule("*", WorkflowStatus.CLARIFICATION_RESPONDED,  WorkflowAction.FLAG_OVERDUE,              "SYSTEM", WorkflowStatus.OVERDUE,                "FLAG_OVERDUE",              false));
        r.add(rule("*", WorkflowStatus.RESUBMITTED,              WorkflowAction.FLAG_OVERDUE,              "SYSTEM", WorkflowStatus.OVERDUE,                "FLAG_OVERDUE",              false));

        // WARN_DEADLINE_APPROACHING: sub-status only, no status change
        r.add(rule("*", WorkflowStatus.SUBMITTED,                WorkflowAction.WARN_DEADLINE_APPROACHING, "SYSTEM", WorkflowStatus.SUBMITTED,              "DEADLINE_WARNING_SENT",     false));
        r.add(rule("*", WorkflowStatus.UNDER_REVIEW,             WorkflowAction.WARN_DEADLINE_APPROACHING, "SYSTEM", WorkflowStatus.UNDER_REVIEW,             "DEADLINE_WARNING_SENT",     false));

        // AUTO_SUPERSEDE: terminal — marks old approved version as superseded
        r.add(rule("*", WorkflowStatus.APPROVED,                 WorkflowAction.AUTO_SUPERSEDE,            "SYSTEM", WorkflowStatus.SUPERSEDED,             null,                        true));
        r.add(rule("*", WorkflowStatus.RE_APPROVED,              WorkflowAction.AUTO_SUPERSEDE,            "SYSTEM", WorkflowStatus.SUPERSEDED,             null,                        true));

        return r;
    }

    private TransitionRule rule(String entityType, WorkflowStatus from, WorkflowAction action,
                                 String role, WorkflowStatus to, String subStatus, boolean clearSub) {
        return TransitionRule.builder()
            .entityType(entityType)
            .fromStatus(from)
            .action(action)
            .requiredRole(role)
            .toStatus(to)
            .subStatusEffect(subStatus)
            .clearSubStatus(clearSub)
            .build();
    }
}
