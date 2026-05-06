package com.templeregistry.controller.governance;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.workflow.WorkflowEnvelope;
import com.templeregistry.entity.workflow.*;
import com.templeregistry.repository.workflow.WorkflowTransitionRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.clarification.*;
import com.templeregistry.service.workflow.*;
import com.templeregistry.service.notification.impl.SseNotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

/**
 * Unified Workflow API v2 controller.
 *
 * Provides:
 *   - POST /api/v2/workflow/{id}/action — execute any workflow action
 *   - GET  /api/v2/workflow/{id}        — get workflow state + available actions
 *   - GET  /api/v2/workflow/dashboard   — DC unified review queue (all modules)
 *   - GET  /api/v2/workflow/{id}/history— full audit trail
 *   - POST /api/v2/workflow/{id}/clarification — open clarification round
 *   - POST /api/v2/workflow/{id}/clarification/{threadId}/respond — TA responds
 *   - GET  /api/v2/notifications/stream — SSE subscription for real-time push
 *
 * All actions go through WorkflowEngine — no module-specific bypass allowed.
 */
@RestController
@RequestMapping("/api/v2/workflow")
@RequiredArgsConstructor
@Tag(name = "Workflow Engine v2", description = "Unified governance workflow across all modules")
public class WorkflowController {

    private final WorkflowEngine workflowEngine;
    private final ClarificationEngine clarificationEngine;
    private final SseNotificationService sseService;
    private final ActionContextResolver actionContextResolver;
    private final WorkflowTransitionRepository transitionRepo;

    // ─── Workflow State ───────────────────────────────────────────────────────

    @GetMapping("/{instanceId}")
    @Operation(summary = "Get workflow state and available actions for a workflow instance")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public ResponseEntity<ApiResponse<WorkflowStateResponse>> getState(
            @PathVariable Long instanceId,
            Authentication auth) {

        ActionContext context = actionContextResolver.resolve(auth);
        WorkflowInstance instance = workflowEngine.getStateById(instanceId);
        List<AvailableAction> actions = workflowEngine.getAvailableActions(instanceId, context);
        ClarificationSummary clarification = clarificationEngine.getSummary(instanceId);

        return ResponseEntity.ok(ApiResponse.success("Workflow state retrieved.",
                WorkflowStateResponse.from(instance, actions, clarification)));
    }

    // ─── Execute Action ───────────────────────────────────────────────────────

    @PostMapping("/{instanceId}/action")
    @Operation(summary = "Execute a workflow action (submit, approve, reject, etc.)")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','DISTRICT_COLLECTOR','DC_STAFF','TEMPLE_AUTHORITY')")
    public ResponseEntity<ApiResponse<WorkflowTransitionResult>> executeAction(
            @PathVariable Long instanceId,
            @Valid @RequestBody WorkflowActionHttpRequest body,
            Authentication auth) {

        ActionContext context = actionContextResolver.resolve(auth);
        WorkflowActionRequest request = WorkflowActionRequest.builder()
            .action(body.action())
            .expectedVersion(body.expectedVersion())
            .idempotencyKey(body.idempotencyKey())
            .comment(body.comment())
            .build();

        WorkflowTransitionResult result = workflowEngine.execute(instanceId, request, context);
        return ResponseEntity.ok(ApiResponse.success("Action executed.", result));
    }

    // ─── Clarification ────────────────────────────────────────────────────────

    @PostMapping("/{instanceId}/clarification")
    @Operation(summary = "DC opens a new clarification round")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<ApiResponse<?>> requestClarification(
            @PathVariable Long instanceId,
            @Valid @RequestBody ClarificationHttpRequest body,
            Authentication auth) {

        ActionContext ctx = actionContextResolver.resolve(auth);
        ClarificationRequest request = ClarificationRequest.builder()
            .message(body.message())
            .sectionName(body.sectionName())
            .fieldNames(body.fieldNames())
            .build();

        var thread = clarificationEngine.requestClarification(instanceId, request, ctx.getActorId(), null);
        return ResponseEntity.ok(ApiResponse.success("Clarification requested.", thread));
    }

    @PostMapping("/{instanceId}/clarification/{threadId}/respond")
    @Operation(summary = "TA responds to a clarification thread")
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public ResponseEntity<ApiResponse<?>> respond(
            @PathVariable Long instanceId,
            @PathVariable Long threadId,
            @Valid @RequestBody ClarificationResponseHttpRequest body,
            Authentication auth) {

        ActionContext ctx = actionContextResolver.resolve(auth);
        ClarificationResponse response = ClarificationResponse.builder()
            .message(body.message())
            .attachmentPaths(body.attachmentPaths())
            .attachmentNames(body.attachmentNames())
            .build();

        var message = clarificationEngine.respond(threadId, response, ctx.getActorId());
        return ResponseEntity.ok(ApiResponse.success("Clarification response submitted.", message));
    }

    @PostMapping("/{instanceId}/clarification/{threadId}/resolve")
    @Operation(summary = "DC resolves a clarification thread")
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public ResponseEntity<Void> resolve(
            @PathVariable Long instanceId,
            @PathVariable Long threadId,
            Authentication auth) {

        ActionContext ctx = actionContextResolver.resolve(auth);
        clarificationEngine.resolve(threadId, ctx.getActorId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{instanceId}/clarification")
    @Operation(summary = "Get all clarification threads for a workflow instance")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public ResponseEntity<ApiResponse<?>> getClarificationThreads(@PathVariable Long instanceId) {
        return ResponseEntity.ok(ApiResponse.success("Clarification threads retrieved.",
                clarificationEngine.getThreads(instanceId)));
    }

    // ─── Audit History ────────────────────────────────────────────────────────

    @GetMapping("/{instanceId}/history")
    @Operation(summary = "Get full audit trail for a workflow instance")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public ResponseEntity<ApiResponse<List<WorkflowTransitionHistoryResponse>>> getHistory(
            @PathVariable Long instanceId) {

        List<com.templeregistry.entity.workflow.WorkflowTransition> transitions =
            transitionRepo.findHistoryByInstanceId(instanceId);

        List<WorkflowTransitionHistoryResponse> history = transitions.stream()
            .map(t -> new WorkflowTransitionHistoryResponse(
                t.getId(),
                t.getFromStatus() != null ? t.getFromStatus().name() : null,
                t.getToStatus().name(),
                t.getFromSubStatus(),
                t.getToSubStatus(),
                t.getAction().name(),
                t.getActorId(),
                t.getActorRole(),
                t.getComment(),
                t.getPerformedAt() != null ? t.getPerformedAt().toString() : null,
                t.getInstanceVersionAtTransition()
            ))
            .toList();

        return ResponseEntity.ok(ApiResponse.success("Workflow history retrieved.", history));
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "DC unified review queue — all modules, all statuses (API v2)")
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<WorkflowInstanceSummaryDto>>> getDashboard(
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long templeId,
            @RequestParam(required = false) List<WorkflowEntityType> entityTypes,
            @RequestParam(required = false) List<WorkflowStatus> statuses,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {

        ActionContext ctx = actionContextResolver.resolve(auth);
        Long resolvedDistrictId = districtId != null ? districtId : ctx.getActorDistrictId();

        WorkflowQueryFilter filter = WorkflowQueryFilter.builder()
            .districtId(resolvedDistrictId)
            .templeId(templeId)
            .entityTypes(entityTypes)
            .statuses(statuses)
            .build();

        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "statusUpdatedAt"));
        org.springframework.data.domain.Page<WorkflowInstanceSummaryDto> result =
            workflowEngine.findForDashboard(filter, pageable)
                .map(WorkflowInstanceSummaryDto::from);
        return ResponseEntity.ok(ApiResponse.success("Workflow dashboard retrieved.", result));
    }

    // ─── Counts (for badge counts) ────────────────────────────────────────────

    @GetMapping("/count/pending")
    @Operation(summary = "Get count of pending items for badge display")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<BadgeCountResponse>> getPendingCount(
            @RequestParam(required = false) Long districtId,
            @RequestParam(required = false) Long templeId,
            Authentication auth) {

        ActionContext ctx = actionContextResolver.resolve(auth);

        long count = 0;
        if (ctx.isDc()) {
            Long d = districtId != null ? districtId : ctx.getActorDistrictId();
            if (d != null) count = workflowEngine.countPendingForDistrict(d);
        } else if (ctx.isTa() && templeId != null) {
            count = workflowEngine.countPendingForTemple(templeId);
        }

        return ResponseEntity.ok(ApiResponse.success("Pending count retrieved.", new BadgeCountResponse(count)));
    }

    // ─── SSE Stream ───────────────────────────────────────────────────────────

    @GetMapping(value = "/notifications/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Subscribe to real-time notification stream via SSE")
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribeToNotifications(Authentication auth) {
        ActionContext ctx = actionContextResolver.resolve(auth);
        return sseService.subscribe(ctx.getActorId());
    }

    // ─── Inner request/response types ────────────────────────────────────────

    public record WorkflowActionHttpRequest(
        WorkflowAction action,
        Long expectedVersion,
        String idempotencyKey,
        String comment
    ) {}

    public record ClarificationHttpRequest(
        String message,
        String sectionName,
        List<String> fieldNames
    ) {}

    public record ClarificationResponseHttpRequest(
        String message,
        List<String> attachmentPaths,
        List<String> attachmentNames
    ) {}

    public record BadgeCountResponse(long pendingCount) {}

    /**
     * Safe DTO for dashboard queries — never exposes raw WorkflowInstance entity.
     */
    public record WorkflowInstanceSummaryDto(
        Long id,
        String entityType,
        Long entityId,
        String status,
        String subStatus,
        Long templeId,
        Long districtId,
        Long createdByUserId,
        String currentActorRole,
        String statusUpdatedAt,
        String submittedAt,
        String deadlineAt,
        Long lockVersion,
        int versionNumber
    ) {
        static WorkflowInstanceSummaryDto from(WorkflowInstance wi) {
            return new WorkflowInstanceSummaryDto(
                wi.getId(),
                wi.getEntityType() != null ? wi.getEntityType().name() : null,
                wi.getEntityId(),
                wi.getStatus() != null ? wi.getStatus().name() : null,
                wi.getSubStatus(),
                wi.getTempleId(),
                wi.getDistrictId(),
                wi.getCreatedByUserId(),
                wi.getCurrentActorRole(),
                wi.getStatusUpdatedAt() != null ? wi.getStatusUpdatedAt().toString() : null,
                wi.getSubmittedAt() != null ? wi.getSubmittedAt().toString() : null,
                wi.getDeadlineAt() != null ? wi.getDeadlineAt().toString() : null,
                wi.getLockVersion(),
                wi.getVersionNumber()
            );
        }
    }

    public record WorkflowTransitionHistoryResponse(
        Long id,
        String fromStatus,
        String toStatus,
        String fromSubStatus,
        String toSubStatus,
        String action,
        Long actorId,
        String actorRole,
        String comment,
        String performedAt,
        Long instanceVersionAtTransition
    ) {}

    public record WorkflowStateResponse(
        Long instanceId,
        String entityType,
        String status,
        String subStatus,
        Long version,
        String currentActor,
        List<AvailableAction> availableActions,
        ClarificationSummary clarification
    ) {
        static WorkflowStateResponse from(WorkflowInstance wi, List<AvailableAction> actions,
                                          ClarificationSummary clarification) {
            return new WorkflowStateResponse(
                wi.getId(), wi.getEntityType().name(), wi.getStatus().name(),
                wi.getSubStatus(), wi.getLockVersion(),
                wi.getCurrentActorRole(), actions, clarification
            );
        }
    }
}
