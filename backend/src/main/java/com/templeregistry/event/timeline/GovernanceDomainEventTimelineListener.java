package com.templeregistry.event.timeline;

import com.templeregistry.event.workflow.GovernanceDomainEvent;
import com.templeregistry.service.timeline.TempleTimelineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listens to GovernanceDomainEvent events fired by WorkflowEngineImpl and writes
 * an entry to the temple_timeline_events table.
 *
 * Safety contract:
 *   1. @TransactionalEventListener(phase = AFTER_COMMIT) — only fires when the workflow
 *      transaction has committed successfully.  Rollbacks never produce timeline rows.
 *   2. @Transactional(propagation = REQUIRES_NEW) — CRITICAL: must use REQUIRES_NEW here
 *      because AFTER_COMMIT fires while TransactionSynchronizationManager is still "active"
 *      (cleanup happens at step 5, after-commit fires at step 4).  Using REQUIRED would cause
 *      logWorkflowEvent to silently join the already-committed transaction — the save would
 *      run in Hibernate's session buffer but never flush to DB.
 *   3. The entire handler body is wrapped in try-catch.  Any failure (DB error, NPE, etc.)
 *      is logged and silently swallowed — the workflow system is primary, timeline is secondary.
 *   4. The service method itself has its own idempotency guard (source_transition_id UNIQUE),
 *      so duplicate delivery from retry scenarios produces exactly one row.
 *
 * DO NOT modify WorkflowEngineImpl, TransitionRuleRegistry, or any governance service.
 * This listener is purely additive.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class GovernanceDomainEventTimelineListener {

    private final TempleTimelineService templeTimelineService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onGovernanceDomainEvent(GovernanceDomainEvent event) {
        try {
            // Skip events with no temple context — nothing to record without a temple.
            if (event.templeId() == null) {
                return;
            }

            templeTimelineService.logWorkflowEvent(event);

        } catch (Exception ex) {
            // Timeline failures must NEVER propagate.  The workflow transaction already
            // committed successfully; logging here is sufficient for observability.
            log.warn("[Timeline] Failed to record workflow event: entityType={} entityId={} action={} error={}",
                event.entityType(), event.entityId(), event.action(), ex.getMessage(), ex);
        }
    }
}
