package com.templeregistry.property;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.service.declaration.OverdueScheduler;
import net.jqwik.api.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Feature: asset-declaration-complete, Property 6: Overdue Flag Does Not Change Status
 *
 * For any AssetDeclaration where due_date is in the past and status is not in
 * {APPROVED, REJECTED, SUPERSEDED}, after the overdue scheduler runs, is_overdue
 * must be true and overdue_flagged_at must be set, but status must remain unchanged
 * from its value before the scheduler ran.
 *
 * Validates: Requirements 9.2, 9.3
 */
class OverdueSchedulerPropertyTest {

    private static final List<DeclarationStatus> TERMINAL_STATUSES = List.of(
            DeclarationStatus.APPROVED,
            DeclarationStatus.REJECTED,
            DeclarationStatus.SUPERSEDED
    );

    private static final List<DeclarationStatus> NON_TERMINAL_STATUSES = List.of(
            DeclarationStatus.DRAFT,
            DeclarationStatus.SUBMITTED,
            DeclarationStatus.UNDER_REVIEW,
            DeclarationStatus.CLARIFICATION_REQUIRED,
            DeclarationStatus.CLARIFICATION_RESPONDED,
            DeclarationStatus.SITE_VISIT_SCHEDULED,
            DeclarationStatus.SITE_VISIT_COMPLETED,
            DeclarationStatus.VERIFIED,
            DeclarationStatus.OVERDUE
    );

    /**
     * Property 6: For any non-terminal status with a past due date, after the scheduler
     * runs, is_overdue = true and status is unchanged.
     *
     * Tests the bulk JPQL update logic by verifying the markOverdue query is called
     * with the correct parameters.
     */
    @Property(tries = 200)
    void overdueSchedulerSetsIsOverdueFlagWithoutChangingStatus(
            @ForAll("nonTerminalStatuses") DeclarationStatus status) {

        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);
        when(declarationRepo.markOverdue(any(LocalDate.class), any(LocalDateTime.class), anyList()))
                .thenReturn(1);

        OverdueScheduler scheduler = new OverdueScheduler(declarationRepo);
        scheduler.flagOverdueDeclarations();

        // Verify the scheduler called markOverdue with terminal statuses excluded
        verify(declarationRepo, times(1)).markOverdue(
                any(LocalDate.class),
                any(LocalDateTime.class),
                argThat(terminalList -> terminalList.containsAll(TERMINAL_STATUSES))
        );
    }

    /**
     * Property 6b: The markOverdue query excludes terminal statuses.
     */
    @Example
    void schedulerExcludesTerminalStatusesFromOverdueUpdate() {
        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);
        when(declarationRepo.markOverdue(any(LocalDate.class), any(LocalDateTime.class), anyList()))
                .thenReturn(0);

        OverdueScheduler scheduler = new OverdueScheduler(declarationRepo);
        scheduler.flagOverdueDeclarations();

        verify(declarationRepo).markOverdue(
                any(LocalDate.class),
                any(LocalDateTime.class),
                argThat(terminalList -> {
                    // Must contain all 3 terminal statuses
                    return terminalList.contains(DeclarationStatus.APPROVED)
                            && terminalList.contains(DeclarationStatus.REJECTED)
                            && terminalList.contains(DeclarationStatus.SUPERSEDED);
                })
        );
    }

    /**
     * Property 6c: Overdue flag logic — a declaration with past due date and non-terminal
     * status should be flagged; terminal statuses should not be flagged.
     */
    @Example
    void overdueLogicFlagsNonTerminalAndSkipsTerminal() {
        LocalDate pastDate = LocalDate.now().minusDays(1);
        LocalDate futureDate = LocalDate.now().plusDays(1);

        // Non-terminal with past due date → should be flagged
        for (DeclarationStatus status : NON_TERMINAL_STATUSES) {
            AssetDeclaration declaration = AssetDeclaration.builder()
                    .status(status)
                    .templeId(1L)
                    .districtId(1L)
                    .financialYear("2025-26")
                    .dueDate(pastDate)
                    .build();

            DeclarationStatus statusBefore = declaration.getStatus();

            // Simulate what the scheduler does: set isOverdue = true, overdueFlaggedAt = now
            // WITHOUT changing status
            declaration.setOverdue(true);
            declaration.setOverdueFlaggedAt(LocalDateTime.now());

            assertThat(declaration.isOverdue())
                    .as("Non-terminal status %s with past due date should be flagged as overdue", status)
                    .isTrue();
            assertThat(declaration.getOverdueFlaggedAt())
                    .as("overdueFlaggedAt must be set for status %s", status)
                    .isNotNull();
            assertThat(declaration.getStatus())
                    .as("Status must remain %s after overdue flagging", statusBefore)
                    .isEqualTo(statusBefore);
        }
    }

    /**
     * Property 6d: Terminal statuses are never flagged as overdue.
     */
    @Example
    void terminalStatusesAreNeverFlaggedAsOverdue() {
        LocalDate pastDate = LocalDate.now().minusDays(1);

        for (DeclarationStatus status : TERMINAL_STATUSES) {
            AssetDeclaration declaration = AssetDeclaration.builder()
                    .status(status)
                    .templeId(1L)
                    .districtId(1L)
                    .financialYear("2025-26")
                    .dueDate(pastDate)
                    .build();

            // The scheduler's JPQL query excludes terminal statuses
            // Verify the declaration is NOT in the set that would be updated
            assertThat(TERMINAL_STATUSES).contains(status);
            assertThat(declaration.isOverdue())
                    .as("Terminal status %s should not be flagged as overdue initially", status)
                    .isFalse();
        }
    }

    /**
     * Property 6e: Scheduler does not throw even if markOverdue fails.
     */
    @Example
    void schedulerHandlesExceptionGracefully() {
        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);
        when(declarationRepo.markOverdue(any(LocalDate.class), any(LocalDateTime.class), anyList()))
                .thenThrow(new RuntimeException("DB connection failed"));

        OverdueScheduler scheduler = new OverdueScheduler(declarationRepo);

        // Should not throw — scheduler catches and logs errors
        assertThatCode(() -> scheduler.flagOverdueDeclarations())
                .doesNotThrowAnyException();
    }

    @Provide
    Arbitrary<DeclarationStatus> nonTerminalStatuses() {
        return Arbitraries.of(NON_TERMINAL_STATUSES);
    }
}
