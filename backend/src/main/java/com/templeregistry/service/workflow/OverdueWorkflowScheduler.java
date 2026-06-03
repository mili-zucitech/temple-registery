package com.templeregistry.service.workflow;

import com.templeregistry.entity.workflow.*;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.workflow.WorkflowInstanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * OverdueWorkflowScheduler — replaces the ad-hoc flagOverdue() scheduler
 * previously in DeclarationServiceImpl.
 *
 * Runs via canonical WorkflowEngine.executeSystem() so every state change
 * is fully audited, outbox-notified, and snapshot-captured.
 *
 * Migration note (Phase B):
 *   Remove any @Scheduled flagOverdue() / setOverdue() calls from:
 *     - DeclarationServiceImpl
 *     - TrustServiceImpl
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OverdueWorkflowScheduler {

    private final WorkflowInstanceRepository instanceRepo;
    private final WorkflowEngine workflowEngine;
    private final DeclarationRepository declarationRepository;

    private static final List<WorkflowStatus> PENDING_STATUSES = List.of(
        WorkflowStatus.SUBMITTED,
        WorkflowStatus.UNDER_REVIEW,
        WorkflowStatus.CLARIFICATION_RESPONDED,
        WorkflowStatus.RESUBMITTED
    );

    // ─── Daily overdue sweep — 02:00 IST (20:30 UTC) ────────────────────────

    @Scheduled(cron = "0 30 20 * * *", zone = "UTC")
    @Transactional
    public void flagOverdueInstances() {
        Instant now = Instant.now();
        List<WorkflowInstance> candidates = instanceRepo.findOverdueInstances(PENDING_STATUSES, now);

        if (candidates.isEmpty()) {
            log.debug("[OverdueScheduler] No overdue instances");
            return;
        }
        log.info("[OverdueScheduler] Flagging {} overdue instances", candidates.size());

        int flagged = 0, failed = 0;
        for (WorkflowInstance wi : candidates) {
            try {
                workflowEngine.executeSystem(wi.getId(),
                    WorkflowAction.FLAG_OVERDUE,
                    "Auto-flagged: deadline was " + wi.getDeadlineAt());

                // Phase A: propagate OVERDUE state to domain entity to keep dual-write in sync.
                // Remove this block after V82 migration drops asset_declarations.status.
                propagateOverdueToDomainEntity(wi);

                flagged++;
            } catch (Exception ex) {
                log.warn("[OverdueScheduler] Failed instance={}: {}", wi.getId(), ex.getMessage());
                failed++;
            }
        }
        log.info("[OverdueScheduler] flagged={} failed={}", flagged, failed);
    }

    /**
     * Propagates OVERDUE state to domain entity after WorkflowEngine transition.
     * Only handles DECLARATION — Trust has no isOverdue flag.
     * Remove after V82 migration drops asset_declarations.status.
     */
    private void propagateOverdueToDomainEntity(WorkflowInstance wi) {
        if (wi.getEntityType() == WorkflowEntityType.DECLARATION) {
            declarationRepository.findById(wi.getEntityId()).ifPresent(declaration -> {
                declaration.setOverdue(true);
                declaration.setOverdueFlaggedAt(LocalDateTime.now(ZoneOffset.UTC));
                declarationRepository.save(declaration);
                log.debug("[OverdueScheduler] Declaration [{}] isOverdue=true flaggedAt set", declaration.getId());
            });
        }
    }

    // ─── Deadline warning sweep — 09:00 IST (03:30 UTC) ─────────────────────

    @Scheduled(cron = "0 30 3 * * *", zone = "UTC")
    @Transactional
    public void warnDeadlineApproaching() {
        Instant now = Instant.now();
        Instant in48h = now.plusSeconds(48 * 3600L);

        List<WorkflowInstance> approaching = instanceRepo.findApproachingDeadlineInstances(
            List.of(WorkflowStatus.SUBMITTED, WorkflowStatus.UNDER_REVIEW), now, in48h);

        if (approaching.isEmpty()) return;
        log.info("[OverdueScheduler] Sending deadline warnings for {} instances", approaching.size());

        for (WorkflowInstance wi : approaching) {
            try {
                workflowEngine.executeSystem(wi.getId(),
                    WorkflowAction.WARN_DEADLINE_APPROACHING,
                    "Deadline approaching: " + wi.getDeadlineAt());
            } catch (Exception ex) {
                log.warn("[OverdueScheduler] Warning failed instance={}: {}", wi.getId(), ex.getMessage());
            }
        }
    }
}
