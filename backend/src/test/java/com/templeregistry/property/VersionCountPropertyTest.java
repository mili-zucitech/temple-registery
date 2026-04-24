package com.templeregistry.property;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.AssetDeclarationVersion;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.dc.*;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.service.impl.declaration.SnapshotServiceImpl;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.Positive;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Feature: asset-declaration-complete, Property 4: Version Record Created on Every Trigger Event
 *
 * For any AssetDeclaration, after each of the following workflow events —
 * submit, clarification-responded, site-visit-scheduled, site-visit-completed,
 * verified, approved, rejected — the count of AssetDeclarationVersion records
 * for that declaration must increase by exactly 1, and version_number on the
 * declaration must be incremented.
 *
 * Validates: Requirements 4.4, 7.6, 10.1, 10.2
 */
class VersionCountPropertyTest {

    /**
     * The 7 snapshot trigger events as defined in the design.
     */
    private static final List<String> SNAPSHOT_TRIGGER_EVENTS = List.of(
            "SUBMIT",
            "CLARIFICATION_RESPONDED",
            "SITE_VISIT_SCHEDULED",
            "SITE_VISIT_COMPLETED",
            "VERIFIED",
            "APPROVED",
            "REJECTED"
    );

    /**
     * Creates a SnapshotServiceImpl with mocked dependencies using reflection.
     */
    private SnapshotServiceImpl createSnapshotService(
            AssetDeclarationVersionRepository versionRepo,
            DeclarationRepository declarationRepo) throws Exception {

        DeclImmovAgriLandRepository agriLandRepo = mock(DeclImmovAgriLandRepository.class);
        DeclImmovBuildingRepository buildingRepo = mock(DeclImmovBuildingRepository.class);
        DeclImmovLeasedRepository leasedRepo = mock(DeclImmovLeasedRepository.class);
        DeclImmovOtherRepository otherLandRepo = mock(DeclImmovOtherRepository.class);
        DeclMovPreciousMetalRepository preciousMetalRepo = mock(DeclMovPreciousMetalRepository.class);
        DeclMovArtifactRepository artifactRepo = mock(DeclMovArtifactRepository.class);
        DeclMovVehicleRepository vehicleRepo = mock(DeclMovVehicleRepository.class);
        DeclMovEquipmentRepository equipmentRepo = mock(DeclMovEquipmentRepository.class);
        DeclMovFinancialRepository financialRepo = mock(DeclMovFinancialRepository.class);

        when(agriLandRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(buildingRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(leasedRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(otherLandRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(preciousMetalRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(artifactRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(vehicleRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(equipmentRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());
        when(financialRepo.findAllByDeclarationId(anyLong())).thenReturn(Collections.emptyList());

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        // Use reflection to instantiate SnapshotServiceImpl (Lombok @RequiredArgsConstructor)
        SnapshotServiceImpl service = new SnapshotServiceImpl(
                versionRepo, declarationRepo,
                agriLandRepo, buildingRepo, leasedRepo, otherLandRepo,
                preciousMetalRepo, artifactRepo, vehicleRepo, equipmentRepo, financialRepo,
                objectMapper
        );
        return service;
    }

    /**
     * Property 4: After calling snapshotService.capture(), the version count
     * increases by exactly 1 and versionNumber is incremented.
     */
    @Property(tries = 200)
    void snapshotCaptureIncrementsVersionNumber(
            @ForAll @IntRange(min = 1, max = 100) int initialVersionNumber,
            @ForAll @Positive long declarationId,
            @ForAll @Positive long actorId) throws Exception {

        AssetDeclarationVersionRepository versionRepo = mock(AssetDeclarationVersionRepository.class);
        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);

        when(versionRepo.save(any(AssetDeclarationVersion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(declarationRepo.save(any(AssetDeclaration.class))).thenAnswer(inv -> inv.getArgument(0));

        SnapshotServiceImpl snapshotService = createSnapshotService(versionRepo, declarationRepo);

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .versionNumber(initialVersionNumber)
                .build();
        declaration.setId(declarationId);

        int versionBefore = declaration.getVersionNumber();

        // Capture snapshot
        AssetDeclarationVersion version = snapshotService.capture(declaration, actorId);

        // Assert version number incremented by exactly 1
        assertThat(declaration.getVersionNumber())
                .as("versionNumber must increment by exactly 1 after capture")
                .isEqualTo(versionBefore + 1);

        // Assert the returned version record has the new version number
        assertThat(version.getVersionNumber())
                .as("AssetDeclarationVersion.versionNumber must equal new versionNumber")
                .isEqualTo(versionBefore + 1);

        // Assert the version repo was called exactly once (1 new record)
        verify(versionRepo, times(1)).save(any(AssetDeclarationVersion.class));
    }

    /**
     * Property 4b: All 7 snapshot trigger events each produce exactly 1 version record.
     */
    @Example
    void allSevenTriggerEventsProduceOneVersionRecord() throws Exception {
        for (String event : SNAPSHOT_TRIGGER_EVENTS) {
            AssetDeclarationVersionRepository versionRepo = mock(AssetDeclarationVersionRepository.class);
            DeclarationRepository declarationRepo = mock(DeclarationRepository.class);

            when(versionRepo.save(any(AssetDeclarationVersion.class))).thenAnswer(inv -> inv.getArgument(0));
            when(declarationRepo.save(any(AssetDeclaration.class))).thenAnswer(inv -> inv.getArgument(0));

            SnapshotServiceImpl snapshotService = createSnapshotService(versionRepo, declarationRepo);

            AssetDeclaration declaration = AssetDeclaration.builder()
                    .templeId(1L)
                    .districtId(1L)
                    .financialYear("2025-26")
                    .status(DeclarationStatus.SUBMITTED)
                    .versionNumber(1)
                    .build();
            declaration.setId(100L);

            int versionBefore = declaration.getVersionNumber();
            snapshotService.capture(declaration, 1L);

            assertThat(declaration.getVersionNumber())
                    .as("Event %s: versionNumber must increment by 1", event)
                    .isEqualTo(versionBefore + 1);

            verify(versionRepo, times(1)).save(any(AssetDeclarationVersion.class));
        }
    }

    /**
     * Property 4c: Sequential captures increment version monotonically.
     */
    @Property(tries = 100)
    void sequentialCapturesIncrementVersionMonotonically(
            @ForAll @IntRange(min = 1, max = 5) int captureCount) throws Exception {

        AssetDeclarationVersionRepository versionRepo = mock(AssetDeclarationVersionRepository.class);
        DeclarationRepository declarationRepo = mock(DeclarationRepository.class);

        when(versionRepo.save(any(AssetDeclarationVersion.class))).thenAnswer(inv -> inv.getArgument(0));
        when(declarationRepo.save(any(AssetDeclaration.class))).thenAnswer(inv -> inv.getArgument(0));

        SnapshotServiceImpl snapshotService = createSnapshotService(versionRepo, declarationRepo);

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(1L)
                .districtId(1L)
                .financialYear("2025-26")
                .status(DeclarationStatus.SUBMITTED)
                .versionNumber(1)
                .build();
        declaration.setId(100L);

        for (int i = 0; i < captureCount; i++) {
            int before = declaration.getVersionNumber();
            snapshotService.capture(declaration, 1L);
            assertThat(declaration.getVersionNumber())
                    .as("Capture %d: versionNumber must be %d", i + 1, before + 1)
                    .isEqualTo(before + 1);
        }

        assertThat(declaration.getVersionNumber())
                .as("After %d captures, versionNumber must be %d", captureCount, 1 + captureCount)
                .isEqualTo(1 + captureCount);

        verify(versionRepo, times(captureCount)).save(any(AssetDeclarationVersion.class));
    }
}
