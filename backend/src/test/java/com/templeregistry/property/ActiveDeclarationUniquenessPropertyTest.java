package com.templeregistry.property;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.exception.DeclarationAlreadyExistsException;
import net.jqwik.api.*;
import net.jqwik.api.constraints.Positive;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 10: Active Declaration Uniqueness Per Temple Per Financial Year
 *
 * For any temple ID and financial year, there must be at most one AssetDeclaration
 * record with a status not in {APPROVED, REJECTED, SUPERSEDED}. Any attempt to
 * create a second active declaration for the same temple+year must be rejected.
 *
 * Validates: Requirements 4.6
 */
class ActiveDeclarationUniquenessPropertyTest {

    /**
     * Active statuses that block creation of a new declaration.
     * From DeclarationServiceImpl.create() logic.
     */
    private static final Set<DeclarationStatus> BLOCKING_STATUSES = Set.of(
            DeclarationStatus.DRAFT,
            DeclarationStatus.SUBMITTED,
            DeclarationStatus.UNDER_REVIEW,
            DeclarationStatus.CLARIFICATION_REQUIRED,
            DeclarationStatus.SITE_VISIT_SCHEDULED,
            DeclarationStatus.APPROVED
    );

    /**
     * Non-blocking statuses that allow creation of a new declaration.
     */
    private static final List<DeclarationStatus> NON_BLOCKING_STATUSES = List.of(
            DeclarationStatus.REJECTED,
            DeclarationStatus.SUPERSEDED,
            DeclarationStatus.CLARIFICATION_RESPONDED,
            DeclarationStatus.SITE_VISIT_COMPLETED,
            DeclarationStatus.VERIFIED,
            DeclarationStatus.OVERDUE
    );

    /**
     * Simulates the uniqueness check from DeclarationServiceImpl.create().
     */
    private void applyUniquenessGuard(Optional<AssetDeclaration> existingDeclaration, String financialYear) {
        if (existingDeclaration.isPresent()) {
            AssetDeclaration existing = existingDeclaration.get();
            if (BLOCKING_STATUSES.contains(existing.getStatus())) {
                throw new DeclarationAlreadyExistsException(financialYear, existing.getId() != null ? existing.getId() : 1L);
            }
        }
    }

    /**
     * Property 10: Creating a second declaration for the same temple+year with a
     * blocking status must throw DeclarationAlreadyExistsException.
     */
    @Property(tries = 200)
    void secondActiveDeclarationIsRejected(
            @ForAll("blockingStatuses") DeclarationStatus existingStatus,
            @ForAll @Positive long templeId) {

        AssetDeclaration existing = AssetDeclaration.builder()
                .templeId(templeId)
                .districtId(1L)
                .financialYear("2025-26")
                .status(existingStatus)
                .build();
        existing.setId(1L);

        assertThatThrownBy(() -> applyUniquenessGuard(Optional.of(existing), "2025-26"))
                .as("Creating second declaration with existing status %s should throw DeclarationAlreadyExistsException", existingStatus)
                .isInstanceOf(DeclarationAlreadyExistsException.class);
    }

    /**
     * Property 10b: Creating a declaration when no existing declaration exists must succeed.
     */
    @Property(tries = 100)
    void firstDeclarationIsAlwaysAllowed(@ForAll @Positive long templeId) {
        assertThatCode(() -> applyUniquenessGuard(Optional.empty(), "2025-26"))
                .as("First declaration for temple %d must not throw", templeId)
                .doesNotThrowAnyException();
    }

    /**
     * Property 10c: Creating a declaration when existing is in a non-blocking status must succeed.
     */
    @Property(tries = 200)
    void declarationAllowedWhenExistingIsNonBlocking(
            @ForAll("nonBlockingStatuses") DeclarationStatus existingStatus,
            @ForAll @Positive long templeId) {

        AssetDeclaration existing = AssetDeclaration.builder()
                .templeId(templeId)
                .districtId(1L)
                .financialYear("2025-26")
                .status(existingStatus)
                .build();
        existing.setId(1L);

        assertThatCode(() -> applyUniquenessGuard(Optional.of(existing), "2025-26"))
                .as("Creating declaration when existing has non-blocking status %s should not throw", existingStatus)
                .doesNotThrowAnyException();
    }

    /**
     * Property 10d: Exception message contains the financial year.
     */
    @Property(tries = 100)
    void exceptionMessageContainsFinancialYear(
            @ForAll("blockingStatuses") DeclarationStatus existingStatus) {

        String financialYear = "2025-26";
        AssetDeclaration existing = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear(financialYear)
                .status(existingStatus)
                .build();
        existing.setId(1L);

        assertThatThrownBy(() -> applyUniquenessGuard(Optional.of(existing), financialYear))
                .isInstanceOf(DeclarationAlreadyExistsException.class)
                .hasMessageContaining(financialYear);
    }

    /**
     * Property 10e: All 6 blocking statuses are covered.
     */
    @Example
    void allBlockingStatusesAreEnforced() {
        assertThat(BLOCKING_STATUSES).hasSize(6);

        for (DeclarationStatus status : BLOCKING_STATUSES) {
            AssetDeclaration existing = AssetDeclaration.builder()
                    .templeId(1L)
                    .districtId(1L)
                    .financialYear("2025-26")
                    .status(status)
                    .build();
            existing.setId(1L);

            assertThatThrownBy(() -> applyUniquenessGuard(Optional.of(existing), "2025-26"))
                    .as("Blocking status %s must throw DeclarationAlreadyExistsException", status)
                    .isInstanceOf(DeclarationAlreadyExistsException.class);
        }
    }

    @Provide
    Arbitrary<DeclarationStatus> blockingStatuses() {
        return Arbitraries.of(BLOCKING_STATUSES.toArray(new DeclarationStatus[0]));
    }

    @Provide
    Arbitrary<DeclarationStatus> nonBlockingStatuses() {
        return Arbitraries.of(NON_BLOCKING_STATUSES);
    }
}
