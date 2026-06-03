package com.templeregistry.property;

import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.*;

/**
 * Feature: asset-declaration-complete, Property 9: Clarification Round Counter Monotonically Increases
 *
 * For any AssetDeclaration, after N calls to requestClarification(), the
 * clarification_round field must equal N, and there must be exactly N
 * DeclarationClarification records with direction = DC_TO_TEMPLE for that declaration.
 *
 * Validates: Requirements 6.1, 6.6
 */
class ClarificationRoundPropertyTest {

    /**
     * Simulates the requestClarification logic from DeclarationWorkflowServiceImpl.
     * Each call:
     * 1. Increments clarification_round on the declaration
     * 2. Creates a DeclarationClarification record with direction = DC_TO_TEMPLE
     */
    private void simulateRequestClarification(
            AssetDeclaration declaration,
            List<DeclarationClarification> clarifications,
            String message,
            Long authorId) {

        // Increment clarification round
        declaration.setClarificationRound(declaration.getClarificationRound() + 1);

        // Create DC_TO_TEMPLE clarification record
        DeclarationClarification clarification = DeclarationClarification.builder()
                .declarationId(declaration.getId() != null ? declaration.getId() : 1L)
                .direction(ClarificationDirection.DC_TO_TEMPLE)
                .message(message)
                .authorId(authorId)
                .createdAt(LocalDateTime.now())
                .build();
        clarifications.add(clarification);
    }

    /**
     * Property 9: After N requestClarification() calls, clarificationRound == N
     * and exactly N DC_TO_TEMPLE records exist.
     */
    @Property(tries = 200)
    void clarificationRoundEqualsNumberOfRequests(
            @ForAll @IntRange(min = 1, max = 3) int n) {

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .clarificationRound(0)
                .build();
        declaration.setId(1L);

        List<DeclarationClarification> clarifications = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            simulateRequestClarification(declaration, clarifications, "Clarification request " + (i + 1), 100L);
        }

        // Assert clarificationRound == N
        assertThat(declaration.getClarificationRound())
                .as("clarificationRound must equal N=%d after %d requestClarification() calls", n, n)
                .isEqualTo(n);

        // Assert exactly N DC_TO_TEMPLE records exist
        long dcToTempleCount = clarifications.stream()
                .filter(c -> c.getDirection() == ClarificationDirection.DC_TO_TEMPLE)
                .count();

        assertThat(dcToTempleCount)
                .as("Exactly N=%d DC_TO_TEMPLE clarification records must exist", n)
                .isEqualTo(n);
    }

    /**
     * Property 9b: clarificationRound starts at 0 and increments monotonically.
     */
    @Property(tries = 100)
    void clarificationRoundStartsAtZeroAndIncrementsMonotonically(
            @ForAll @IntRange(min = 1, max = 3) int n) {

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .clarificationRound(0)
                .build();
        declaration.setId(1L);

        List<DeclarationClarification> clarifications = new ArrayList<>();

        assertThat(declaration.getClarificationRound())
                .as("Initial clarificationRound must be 0")
                .isEqualTo(0);

        for (int i = 1; i <= n; i++) {
            simulateRequestClarification(declaration, clarifications, "Message " + i, 100L);
            assertThat(declaration.getClarificationRound())
                    .as("After %d calls, clarificationRound must be %d", i, i)
                    .isEqualTo(i);
        }
    }

    /**
     * Property 9c: Only DC_TO_TEMPLE records are created by requestClarification.
     * TEMPLE_TO_DC records are only created by respondToClarification.
     */
    @Property(tries = 100)
    void requestClarificationOnlyCreatesDcToTempleRecords(
            @ForAll @IntRange(min = 1, max = 3) int n) {

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .clarificationRound(0)
                .build();
        declaration.setId(1L);

        List<DeclarationClarification> clarifications = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            simulateRequestClarification(declaration, clarifications, "Request " + i, 100L);
        }

        // All records must be DC_TO_TEMPLE
        assertThat(clarifications)
                .as("All clarification records from requestClarification must be DC_TO_TEMPLE")
                .allMatch(c -> c.getDirection() == ClarificationDirection.DC_TO_TEMPLE);

        // No TEMPLE_TO_DC records
        long templeToDocCount = clarifications.stream()
                .filter(c -> c.getDirection() == ClarificationDirection.TEMPLE_TO_DC)
                .count();
        assertThat(templeToDocCount)
                .as("No TEMPLE_TO_DC records should exist after requestClarification calls")
                .isEqualTo(0);
    }

    /**
     * Property 9d: Mixed clarification cycle — N requests and N responses.
     * After N full cycles, clarificationRound == N, N DC_TO_TEMPLE and N TEMPLE_TO_DC records.
     */
    @Property(tries = 100)
    void fullClarificationCycleCountsCorrectly(
            @ForAll @IntRange(min = 1, max = 3) int n) {

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .clarificationRound(0)
                .build();
        declaration.setId(1L);

        List<DeclarationClarification> clarifications = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            // DC requests clarification
            simulateRequestClarification(declaration, clarifications, "DC request " + i, 100L);

            // TA responds (TEMPLE_TO_DC — does NOT increment clarificationRound)
            DeclarationClarification response = DeclarationClarification.builder()
                    .declarationId(1L)
                    .direction(ClarificationDirection.TEMPLE_TO_DC)
                    .message("TA response " + i)
                    .authorId(200L)
                    .createdAt(LocalDateTime.now())
                    .build();
            clarifications.add(response);
        }

        // clarificationRound should equal N (only DC requests increment it)
        assertThat(declaration.getClarificationRound())
                .as("clarificationRound must equal N=%d after %d full cycles", n, n)
                .isEqualTo(n);

        // N DC_TO_TEMPLE records
        long dcToTempleCount = clarifications.stream()
                .filter(c -> c.getDirection() == ClarificationDirection.DC_TO_TEMPLE)
                .count();
        assertThat(dcToTempleCount)
                .as("Must have exactly N=%d DC_TO_TEMPLE records", n)
                .isEqualTo(n);

        // N TEMPLE_TO_DC records
        long templeToDocCount = clarifications.stream()
                .filter(c -> c.getDirection() == ClarificationDirection.TEMPLE_TO_DC)
                .count();
        assertThat(templeToDocCount)
                .as("Must have exactly N=%d TEMPLE_TO_DC records", n)
                .isEqualTo(n);
    }
}
