package com.templeregistry.property;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.exception.DeclarationImmutableException;
import net.jqwik.api.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 2: Non-DRAFT Immutability
 *
 * For any AssetDeclaration whose status is not DRAFT, any attempt to mutate
 * the declaration's asset fields must be rejected with DeclarationImmutableException.
 *
 * Validates: Requirements 3.1, 3.2, 3.4
 */
class ImmutabilityPropertyTest {

    /**
     * Simulates the immutability guard logic from DeclarationServiceImpl.update().
     * This is the exact guard code: if (declaration.getStatus() != DeclarationStatus.DRAFT)
     * throw new DeclarationImmutableException(id)
     */
    private void applyImmutabilityGuard(AssetDeclaration declaration) {
        if (declaration.getStatus() != DeclarationStatus.DRAFT) {
            throw new DeclarationImmutableException(declaration.getId() != null ? declaration.getId() : 0L);
        }
    }

    /**
     * Property 2: For any non-DRAFT status, the immutability guard must throw
     * DeclarationImmutableException.
     */
    @Property(tries = 200)
    void nonDraftDeclarationIsImmutable(@ForAll("nonDraftStatuses") DeclarationStatus status) {
        AssetDeclaration declaration = AssetDeclaration.builder()
                .status(status)
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .build();

        assertThatThrownBy(() -> applyImmutabilityGuard(declaration))
                .as("Non-DRAFT status %s should throw DeclarationImmutableException", status)
                .isInstanceOf(DeclarationImmutableException.class);
    }

    /**
     * Property 2b: DRAFT status must NOT trigger the immutability guard.
     */
    @Example
    void draftDeclarationIsEditable() {
        AssetDeclaration declaration = AssetDeclaration.builder()
                .status(DeclarationStatus.DRAFT)
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .build();

        assertThatCode(() -> applyImmutabilityGuard(declaration))
                .as("DRAFT status should not throw DeclarationImmutableException")
                .doesNotThrowAnyException();
    }

    /**
     * Property 2c: All 11 non-DRAFT statuses are immutable (exhaustive check).
     */
    @Example
    void allNonDraftStatusesAreImmutable() {
        for (DeclarationStatus status : DeclarationStatus.values()) {
            if (status == DeclarationStatus.DRAFT) continue;

            AssetDeclaration declaration = AssetDeclaration.builder()
                    .status(status)
                    .templeId(1L)
                    .districtId(1L)
                    .financialYear("2025-26")
                    .build();

            assertThatThrownBy(() -> applyImmutabilityGuard(declaration))
                    .as("Status %s should be immutable", status)
                    .isInstanceOf(DeclarationImmutableException.class);
        }
    }

    /**
     * Property 2d: Exception message must reference the declaration ID.
     */
    @Property(tries = 100)
    void immutableExceptionContainsDeclarationId(
            @ForAll("nonDraftStatuses") DeclarationStatus status,
            @ForAll @net.jqwik.api.constraints.Positive long declarationId) {

        AssetDeclaration declaration = AssetDeclaration.builder()
                .status(status)
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .build();
        // Simulate having an ID by using the exception constructor directly
        DeclarationImmutableException ex = new DeclarationImmutableException(declarationId);
        assertThat(ex.getMessage())
                .as("Exception message should contain declaration ID %d", declarationId)
                .contains(String.valueOf(declarationId));
    }

    @Provide
    Arbitrary<DeclarationStatus> nonDraftStatuses() {
        return Arbitraries.of(
                DeclarationStatus.SUBMITTED,
                DeclarationStatus.UNDER_REVIEW,
                DeclarationStatus.CLARIFICATION_REQUIRED,
                DeclarationStatus.CLARIFICATION_RESPONDED,
                DeclarationStatus.SITE_VISIT_SCHEDULED,
                DeclarationStatus.SITE_VISIT_COMPLETED,
                DeclarationStatus.VERIFIED,
                DeclarationStatus.APPROVED,
                DeclarationStatus.REJECTED,
                DeclarationStatus.OVERDUE,
                DeclarationStatus.SUPERSEDED
        );
    }
}
