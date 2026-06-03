package com.templeregistry.service.declaration;

import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.declaration.DeclarationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

/**
 * @deprecated Replaced by OverdueWorkflowScheduler which uses the canonical WorkflowEngine
 * to raise overdue transitions. This class is excluded from the Spring context.
 * Remove in a future cleanup sprint.
 */
@Deprecated(forRemoval = true)
@RequiredArgsConstructor
@Slf4j
public class OverdueScheduler {

    private static final List<DeclarationStatus> TERMINAL_STATUSES = List.of(
            DeclarationStatus.APPROVED,
            DeclarationStatus.REJECTED,
            DeclarationStatus.SUPERSEDED
    );

    private final DeclarationRepository declarationRepository;

    /**
     * Runs daily at 01:00 UTC.
     * Uses a bulk JPQL update to avoid loading all records into memory.
     */
    @Scheduled(cron = "0 0 1 * * *", zone = "UTC")
    @Transactional
    public void flagOverdueDeclarations() {
        try {
            LocalDate today = LocalDate.now(ZoneOffset.UTC);
            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            int updated = declarationRepository.markOverdue(today, now, TERMINAL_STATUSES);
            log.info("Marked {} declarations as overdue", updated);
        } catch (Exception e) {
            log.error("Failed to flag overdue declarations", e);
        }
    }
}
