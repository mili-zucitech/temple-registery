package com.templeregistry.service.workflow.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.entity.notification.NotificationOutbox;
import com.templeregistry.entity.workflow.*;
import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.exception.WorkflowException;
import com.templeregistry.repository.notification.NotificationOutboxRepository;
import com.templeregistry.repository.workflow.IdempotencyRecordRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.workflow.*;
import com.templeregistry.entity.versioning.EntityVersion;
import com.templeregistry.entity.versioning.EntityVersionStatus;
import com.templeregistry.exception.EntityNotFoundException;
import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Production-grade WorkflowEngine implementation.
 *
 * Execution order per transition:
 *   1. Idempotency check — return cached result if key already processed
 *   2. Load workflow instance (optimistic lock via @Version)
 *   3. Transition rule lookup — deny if no rule found
 *   4. Role check — deny if actor role doesn't match required role
 *   5. Jurisdiction check — DC must be in same district as workflow instance
 *   6. Ownership check — TA must own the temple
 *   7. Policy evaluation — module-specific business rules
 *   8. Version check — expectedVersion must match lock_version
 *   9. Execute transition (update status, sub-status, version_number, timestamps)
 *  10. Record WorkflowTransition (immutable audit row)
 *  11. Write to notification_outbox (outbox pattern — same TX as state change)
 *  12. Save idempotency record
 *  13. Publish GovernanceDomainEvent (AFTER_COMMIT — in-process fast path)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowEngineImpl implements WorkflowEngine {

    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowTransitionRepository transitionRepo;
    private final IdempotencyRecordRepository idempotencyRepo;
    private final NotificationOutboxRepository outboxRepo;
    private final TransitionRuleRegistry ruleRegistry;
    private final List<WorkflowPolicy> policies;          // all @Component policies auto-injected
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;
    private final VersionService versionService;
    private final GovernanceAuditService governanceAuditService;

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public WorkflowInstance initiate(WorkflowEntityType entityType, Long entityId,
                                      Long templeId, Long districtId, Long createdBy, String actorRole) {
        // Idempotent: if an instance already exists, return it rather than throwing.
        // The unique index (entity_type, entity_id) is the true duplicate guard at the DB level.
        // Returning the existing instance here makes callers safe to call initiate() without
        // a prior existence check, eliminating the TOCTOU race in the service layer.
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .orElseGet(() -> {
                String effectiveActorRole = (actorRole == null || actorRole.isBlank()) ? "TA" : actorRole;

                WorkflowInstance instance = WorkflowInstance.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .status(WorkflowStatus.DRAFT)
                    .lockVersion(0L)
                    .versionNumber(1)
                    .currentActorRole("TA")
                    .createdByUserId(createdBy)
                    .templeId(templeId)
                    .districtId(districtId)
                    .statusUpdatedAt(Instant.now())
                    .build();

                WorkflowInstance saved = instanceRepo.save(instance);

                // ── Initial transition: NULL → DRAFT ──────────────────────────
                // Records the creation event in the audit trail so workflow_transitions
                // always has at least one row per instance from birth.
                WorkflowTransition initTransition = WorkflowTransition.builder()
                    .workflowInstance(saved)
                    .fromStatus(null)           // no prior state
                    .toStatus(WorkflowStatus.DRAFT)
                    .fromSubStatus(null)
                    .toSubStatus(null)
                    .action(WorkflowAction.SYSTEM_INITIATE)
                    .actorId(createdBy)
                    .actorRole(effectiveActorRole)
                    .comment("Workflow initiated — initial DRAFT created")
                    .instanceVersionAtTransition(0L)
                    .performedAt(Instant.now())
                    .idempotencyKey("INIT:" + entityType.name() + ":" + entityId)
                    .build();
                WorkflowTransition savedTransition = transitionRepo.save(initTransition);

                // ── Initial entity_version: v1 DRAFT_OVERLAY snapshot ─────────
                // Captures the entity state at creation so version history starts at v1.
                // Uses a minimal JSON stub because the full entity may not be loaded here;
                // the real snapshot is overwritten on SUBMIT via versionService.snapshot().
                try {
                    String initSnapshot = String.format(
                        "{\"entityType\":\"%s\",\"entityId\":%d,\"initiatedAt\":\"%s\",\"initiatedBy\":%d}",
                        entityType.name(), entityId, Instant.now(), createdBy
                    );
                    com.templeregistry.entity.versioning.EntityVersionStatus draftStatus =
                        com.templeregistry.entity.versioning.EntityVersionStatus.DRAFT_OVERLAY;
                    com.templeregistry.entity.versioning.EntityVersion initVersion =
                        com.templeregistry.entity.versioning.EntityVersion.builder()
                            .workflowInstance(saved)
                            .entityType(entityType.name())
                            .entityId(entityId)
                            .versionNumber(1)
                            .status(draftStatus)
                            .snapshotJson(initSnapshot)
                            .diffJson(null)
                            .capturedAt(Instant.now())
                            .capturedByUserId(createdBy)
                            .createdByUserId(createdBy != null ? createdBy : 0L)
                            .triggeringTransitionId(savedTransition.getId())
                            .build();
                    versionService.saveRaw(initVersion);
                } catch (Exception ex) {
                    // Non-fatal — version snapshot failure must not roll back workflow creation
                    log.warn("[WorkflowEngine] Initial entity_version snapshot failed for {}:{}: {}",
                        entityType, entityId, ex.getMessage());
                }

                log.info("[WorkflowEngine] Initiated {} entity={} instance={} transition={} written",
                    entityType, entityId, saved.getId(), savedTransition.getId());
                return saved;
            });
    }

    // ─── Execute ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public WorkflowTransitionResult execute(Long workflowInstanceId,
                                             WorkflowActionRequest request,
                                             ActionContext context) {
        // ── Step 1: Idempotency check ─────────────────────────────────────────
        if (request.getIdempotencyKey() != null) {
            var cached = idempotencyRepo.findByIdempotencyKey(request.getIdempotencyKey());
            if (cached.isPresent() && "SUCCESS".equals(cached.get().getResultStatus())) {
                log.info("[WorkflowEngine] Idempotency hit for key={}", request.getIdempotencyKey());
                WorkflowTransitionResult cachedResult = deserializeCachedResult(cached.get().getResultJson());
                // Only short-circuit if deserialization succeeded. If it fails,
                // deserializeCachedResult returns null and logs a warning; fall through
                // to re-execute so callers never receive a null result.
                if (cachedResult != null) {
                    return cachedResult;
                }
                log.warn("[WorkflowEngine] Idempotency cache miss-deserialize for key={} — re-executing",
                    request.getIdempotencyKey());
            }
        }

        // ── Step 2: Load instance ─────────────────────────────────────────────
        WorkflowInstance instance = instanceRepo.findById(workflowInstanceId)
            .orElseThrow(() -> new EntityNotFoundException("WorkflowInstance", workflowInstanceId));

        WorkflowStatus fromStatus = instance.getStatus();
        String fromSubStatus = instance.getSubStatus();
        String entityTypeName = instance.getEntityType().name();

        // ── Step 3: Transition rule lookup ────────────────────────────────────
        TransitionRule rule = ruleRegistry.find(entityTypeName, fromStatus, request.getAction())
            .orElseThrow(() -> new WorkflowException(
                String.format("No transition rule: %s %s -[%s]->", entityTypeName, fromStatus, request.getAction())
            ));

        // ── Step 4: Role check ────────────────────────────────────────────────
        if (!context.isSystem() && !roleMatches(rule.getRequiredRole(), context)) {
            throw new WorkflowException(
                "Role " + context.getActorRole() + " cannot execute " + request.getAction()
                + " (requires " + rule.getRequiredRole() + ")"
            );
        }

        // ── Step 5: Jurisdiction check (DC only) ──────────────────────────────
        if (context.isDc() && context.getActorDistrictId() != null
                && !context.getActorDistrictId().equals(instance.getDistrictId())) {
            throw new WorkflowException(
                "DC district " + context.getActorDistrictId()
                + " does not match instance district " + instance.getDistrictId()
            );
        }

        // ── Step 6: Ownership check (TA only) ─────────────────────────────────
        if (context.isTa() && context.getOwnedTempleIds() != null
                && !context.getOwnedTempleIds().contains(instance.getTempleId())) {
            throw new WorkflowException("TA does not own temple " + instance.getTempleId());
        }

        // ── Step 6b: Comment required check ──────────────────────────────────
        // AvailableAction.requiresComment(true) is a UI hint. This is the authoritative
        // backend enforcement for actions that MUST carry a reason for audit trail quality.
        if (!context.isSystem() && commentIsRequired(request.getAction())
                && (request.getComment() == null || request.getComment().isBlank())) {
            throw new WorkflowException(
                "Action " + request.getAction() + " requires a non-empty comment/reason.");
        }

        // ── Step 7: Policy evaluation ─────────────────────────────────────────
        policies.stream()
            .filter(p -> ("*".equals(p.entityType()) || p.entityType().equals(entityTypeName))
                      && p.action() == request.getAction())
            .forEach(p -> {
                PolicyResult result = p.evaluate(instance, context);
                if (!result.isAllowed()) {
                    throw new WorkflowException("Policy denied: " + result.getDenyReason());
                }
            });

        // ── Step 8: Version check ─────────────────────────────────────────────
        if (request.getExpectedVersion() != null
                && !request.getExpectedVersion().equals(instance.getLockVersion())) {
            throw new OptimisticLockException(
                "Stale version: expected=" + request.getExpectedVersion()
                + " actual=" + instance.getLockVersion()
            );
        }

        // ── Step 9: Execute transition ────────────────────────────────────────
        WorkflowStatus toStatus = rule.getToStatus();
        String toSubStatus = computeSubStatus(rule, fromSubStatus);

        instance.setStatus(toStatus);
        instance.setSubStatus(toSubStatus);
        instance.setStatusUpdatedAt(Instant.now());
        instance.setCurrentActorRole(resolveNextActor(toStatus));

        if (toStatus == WorkflowStatus.SUBMITTED && instance.getSubmittedAt() == null) {
            instance.setSubmittedAt(Instant.now());
        }
        if (request.getAction() == WorkflowAction.EDIT_APPROVED) {
            instance.setVersionNumber(instance.getVersionNumber() + 1);
        }

        // @Version auto-increments lock_version on save
        WorkflowInstance saved = instanceRepo.save(instance);

        // ── Step 10: Record audit transition ──────────────────────────────────
        WorkflowTransition transition = WorkflowTransition.builder()
            .workflowInstance(saved)
            .fromStatus(fromStatus)
            .toStatus(toStatus)
            .fromSubStatus(fromSubStatus)
            .toSubStatus(toSubStatus)
            .action(request.getAction())
            .actorId(context.getActorId())
            .actorRole(context.getActorRole())
            .comment(request.getComment())
            .instanceVersionAtTransition(instance.getLockVersion() - 1)
            .performedAt(Instant.now())
            .idempotencyKey(request.getIdempotencyKey())
            .build();
        WorkflowTransition savedTransition = transitionRepo.save(transition);

        // Keep governance_action_history in lockstep with workflow_transitions.
        governanceAuditService.logWorkflowTransition(saved, savedTransition);

        // ── Step 11: Write to notification_outbox (same TX as state change) ───
        GovernanceDomainEvent domainEvent = GovernanceDomainEvent.workflowTransition(
            saved.getEntityType(), saved.getEntityId(), saved.getId(),
            request.getAction(), fromStatus, toStatus, fromSubStatus, toSubStatus,
            context.getActorId(), context.getActorRole(),
            saved.getTempleId(), saved.getDistrictId(),
            request.getIdempotencyKey(),
            Map.of(
                "comment", request.getComment() != null ? request.getComment() : "",
                "transitionId", savedTransition.getId()
            )
        );
        writeToOutbox(domainEvent);

        // ── Step 12: Save idempotency record ──────────────────────────────────
        List<AvailableAction> available = computeAvailableActions(saved, context);
        WorkflowTransitionResult result = WorkflowTransitionResult.from(saved, available);

        if (request.getIdempotencyKey() != null) {
            saveIdempotencyRecord(request.getIdempotencyKey(), saved.getId(),
                request.getAction(), result, context.getActorId());
        }

        // ── Step 13: Publish in-process event AFTER commit ────────────────────
        eventPublisher.publishEvent(domainEvent);

        log.info("[WorkflowEngine] Transition: instance={} {} -[{}]-> {} (actor={})",
            saved.getId(), fromStatus, request.getAction(), toStatus, context.getActorId());

        return result;
    }

    @Override
    @Transactional
    public WorkflowTransitionResult executeSystem(Long workflowInstanceId,
                                                   WorkflowAction action, String comment) {
        return execute(workflowInstanceId,
            WorkflowActionRequest.builder()
                .action(action)
                .comment(comment)
                .idempotencyKey(UUID.randomUUID().toString())
                .build(),
            ActionContext.system()
        );
    }

    // ─── Queries ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public WorkflowInstance getState(WorkflowEntityType entityType, Long entityId) {
        return instanceRepo.findByEntityTypeAndEntityId(entityType, entityId)
            .orElseThrow(() -> new EntityNotFoundException(
                "No workflow instance for " + entityType + ":" + entityId, "WORKFLOW_INSTANCE_NOT_FOUND"));
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowInstance getStateById(Long workflowInstanceId) {
        return instanceRepo.findById(workflowInstanceId)
            .orElseThrow(() -> new EntityNotFoundException("WorkflowInstance", workflowInstanceId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailableAction> getAvailableActions(Long workflowInstanceId, ActionContext context) {
        WorkflowInstance instance = getStateById(workflowInstanceId);
        return computeAvailableActions(instance, context);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkflowInstance> findForDashboard(WorkflowQueryFilter filter, Pageable pageable) {
        List<WorkflowStatus> statuses = filter.getStatuses() != null
            ? filter.getStatuses()
            : List.of(WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW,
                      WorkflowStatus.CLARIFICATION_RESPONDED, WorkflowStatus.RESUBMITTED);

        if (filter.getDistrictId() != null && filter.getEntityTypes() != null && !filter.getEntityTypes().isEmpty()) {
            return instanceRepo.findByDistrictEntityTypesAndStatuses(
                filter.getDistrictId(), filter.getEntityTypes(), statuses, pageable);
        } else if (filter.getDistrictId() != null) {
            return instanceRepo.findByDistrictAndStatuses(filter.getDistrictId(), statuses, pageable);
        }
        return Page.empty(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingForDistrict(Long districtId) {
        return instanceRepo.countByDistrictIdAndStatusIn(districtId, List.of(
            WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW,
            WorkflowStatus.CLARIFICATION_RESPONDED, WorkflowStatus.RESUBMITTED
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public long countPendingForTemple(Long templeId) {
        return instanceRepo.countByTempleIdAndStatusIn(templeId, List.of(
            WorkflowStatus.CLARIFICATION_REQUESTED, WorkflowStatus.UPDATED_AFTER_APPROVAL
        ));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Returns true for actions that MUST carry a non-empty comment for audit trail integrity.
     * This is the authoritative backend check — frontend requiresComment is advisory only.
     */
    private boolean commentIsRequired(WorkflowAction action) {
        return switch (action) {
            case REJECT, REQUEST_CLARIFICATION, SEND_BACK, RESPOND_CLARIFICATION -> true;
            default -> false;
        };
    }

    private boolean roleMatches(String required, ActionContext ctx) {
        return switch (required) {
            // SUPER_ADMIN can act on any TA-level transition (no ownership restriction applied)
            case "TA"         -> ctx.isTa() || ctx.isSuperAdmin();
            // SUPER_ADMIN can act on any DC-level transition (no jurisdiction restriction applied)
            case "DC"         -> ctx.isDc() || ctx.isSuperAdmin();
            case "SYSTEM"     -> ctx.isSystem();
            case "SUPER_ADMIN"-> ctx.isSuperAdmin();
            default           -> false;
        };
    }

    private String computeSubStatus(TransitionRule rule, String currentSubStatus) {
        if (rule.getSubStatusEffect() != null) return rule.getSubStatusEffect();
        if (rule.isClearSubStatus()) return null;
        return currentSubStatus; // inherit
    }

    private String resolveNextActor(WorkflowStatus status) {
        return switch (status) {
            case DRAFT, CLARIFICATION_REQUESTED, UPDATED_AFTER_APPROVAL, REJECTED -> "TA";
            case SUBMITTED, UNDER_REVIEW, CLARIFICATION_RESPONDED, RESUBMITTED    -> "DC";
            default -> null;
        };
    }

    private List<AvailableAction> computeAvailableActions(WorkflowInstance instance, ActionContext context) {
        return ruleRegistry.findAll().stream()
            .filter(r -> (r.getEntityType().equals("*") || r.getEntityType().equals(instance.getEntityType().name()))
                      && r.getFromStatus() == instance.getStatus()
                      && roleMatches(r.getRequiredRole(), context))
            .filter(r -> policies.stream()
                .filter(p -> ("*".equals(p.entityType()) || p.entityType().equals(instance.getEntityType().name()))
                          && p.action() == r.getAction())
                .allMatch(p -> p.evaluate(instance, context).isAllowed()))
            .map(r -> buildAvailableAction(r.getAction()))
            .collect(Collectors.toList());
    }

    private AvailableAction buildAvailableAction(WorkflowAction action) {
        return switch (action) {
            case SUBMIT              -> AvailableAction.builder().action(action).label("Submit for Review").requiresComment(false).requiresVersion(true).build();
            case APPROVE             -> AvailableAction.builder().action(action).label("Approve").requiresComment(false).requiresVersion(true).confirmationMessage("Approve this submission?").build();
            case RE_APPROVE          -> AvailableAction.builder().action(action).label("Re-Approve").requiresComment(false).requiresVersion(true).confirmationMessage("Re-approve this updated submission?").build();
            case REJECT              -> AvailableAction.builder().action(action).label("Reject").requiresComment(true).requiresVersion(true).confirmationMessage("Reject this submission? This action is irreversible.").build();
            case REQUEST_CLARIFICATION -> AvailableAction.builder().action(action).label("Request Clarification").requiresComment(true).requiresVersion(true).build();
            case BEGIN_REVIEW        -> AvailableAction.builder().action(action).label("Begin Review").requiresComment(false).requiresVersion(false).build();
            case RESPOND_CLARIFICATION -> AvailableAction.builder().action(action).label("Respond to Clarification").requiresComment(true).requiresVersion(false).build();
            case RESUBMIT            -> AvailableAction.builder().action(action).label("Resubmit").requiresComment(false).requiresVersion(false).build();
            case EDIT_APPROVED       -> AvailableAction.builder().action(action).label("Edit Record").requiresComment(false).requiresVersion(false).confirmationMessage("Editing this record will require DC re-approval.").build();
            case WITHDRAW            -> AvailableAction.builder().action(action).label("Withdraw").requiresComment(false).requiresVersion(false).confirmationMessage("Withdraw this submission?").build();
            default                  -> AvailableAction.builder().action(action).label(action.name()).requiresComment(false).requiresVersion(false).build();
        };
    }

    private void writeToOutbox(GovernanceDomainEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            NotificationOutbox outbox = NotificationOutbox.builder()
                .eventPayloadJson(payload)
                .workflowInstanceId(event.workflowInstanceId())
                .eventType(event.eventType())
                .dispatchStatus("PENDING")
                .createdAtInstant(Instant.now())
                .retryCount(0)
                .build();
            outboxRepo.save(outbox);
        } catch (Exception e) {
            log.error("[WorkflowEngine] Failed to write outbox event", e);
            // Do NOT rethrow — outbox failure must not roll back the workflow transition
        }
    }

    private void saveIdempotencyRecord(String key, Long instanceId, WorkflowAction action,
                                        WorkflowTransitionResult result, Long actorId) {
        try {
            String json = objectMapper.writeValueAsString(result);
            IdempotencyRecord record = IdempotencyRecord.builder()
                .idempotencyKey(key)
                .actorUserId(actorId != null ? actorId : 0L)
                .workflowInstanceId(instanceId)
                .action(action)
                .resultStatus("SUCCESS")
                .resultJson(json)
                .createdAtInstant(Instant.now())
                .expiresAt(Instant.now().plusSeconds(86400)) // 24h TTL
                .build();
            idempotencyRepo.save(record);
        } catch (Exception e) {
            log.warn("[WorkflowEngine] Failed to save idempotency record for key={}: {}", key, e.getMessage());
        }
    }

    private WorkflowTransitionResult deserializeCachedResult(String json) {
        try {
            return objectMapper.readValue(json, WorkflowTransitionResult.class);
        } catch (Exception e) {
            log.warn("[WorkflowEngine] Failed to deserialize cached result, re-executing");
            return null;
        }
    }
}
