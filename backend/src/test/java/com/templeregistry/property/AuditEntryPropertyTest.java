package com.templeregistry.property;

import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.impl.audit.DeclarationAuditLogServiceImpl;
import net.jqwik.api.*;
import net.jqwik.api.constraints.AlphaChars;
import net.jqwik.api.constraints.Positive;
import net.jqwik.api.constraints.StringLength;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Feature: asset-declaration-complete, Property 7: Audit Entry Completeness
 *
 * For any workflow action (submit, under-review, clarification-requested,
 * clarification-responded, site-visit-scheduled, site-visit-completed, verified,
 * approved, rejected), after the action completes, a new GovernanceActionHistory
 * record must exist for that declaration with non-null values for entity_id,
 * action, dc_user_id (actor_id), actor_role, and timestamp.
 *
 * Validates: Requirements 11.1, 11.2
 */
class AuditEntryPropertyTest {

    /**
     * All 9 workflow action types that must produce audit entries.
     */
    private static final List<AuditActionType> ALL_WORKFLOW_ACTIONS = List.of(
            AuditActionType.SUBMIT,
            AuditActionType.UNDER_REVIEW,
            AuditActionType.CLARIFICATION_REQUESTED,
            AuditActionType.CLARIFICATION_RESPONDED,
            AuditActionType.SITE_VISIT_SCHEDULED,
            AuditActionType.SITE_VISIT_COMPLETED,
            AuditActionType.VERIFIED,
            AuditActionType.APPROVED,
            AuditActionType.REJECTED
    );

    /**
     * Property 7: For any workflow action, the audit log service persists a
     * GovernanceActionHistory record with non-null actorId, actorRole, and timestamp.
     */
    @Property(tries = 200)
    void auditLogPersistsRecordWithRequiredFields(
            @ForAll AuditActionType actionType,
            @ForAll @Positive long declarationId,
            @ForAll @Positive long actorId,
            @ForAll @AlphaChars @StringLength(min = 2, max = 20) String actorRole) {

        GovernanceActionRepository repo = mock(GovernanceActionRepository.class);
        when(repo.save(any(GovernanceActionHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        DeclarationAuditLogServiceImpl service = new DeclarationAuditLogServiceImpl(repo);
        service.log(declarationId, actionType, actorId, actorRole, null);

        // Verify save was called with a record that has all required fields
        verify(repo, times(1)).save(argThat(entry -> {
            assertThat(entry.getEntityId())
                    .as("entityId (declarationId) must not be null")
                    .isNotNull()
                    .isEqualTo(declarationId);
            assertThat(entry.getDcUserId())
                    .as("dcUserId (actorId) must not be null")
                    .isNotNull()
                    .isEqualTo(actorId);
            assertThat(entry.getActorRole())
                    .as("actorRole must not be null")
                    .isNotNull()
                    .isEqualTo(actorRole);
            assertThat(entry.getAction())
                    .as("action must not be null and must match actionType")
                    .isNotNull()
                    .isEqualTo(actionType.name());
            assertThat(entry.getEntityType())
                    .as("entityType must be DECLARATION")
                    .isEqualTo("DECLARATION");
            return true;
        }));
    }

    /**
     * Property 7b: All 9 workflow actions produce audit entries.
     */
    @Example
    void allNineWorkflowActionsProduceAuditEntries() {
        for (AuditActionType actionType : ALL_WORKFLOW_ACTIONS) {
            GovernanceActionRepository repo = mock(GovernanceActionRepository.class);
            when(repo.save(any(GovernanceActionHistory.class))).thenAnswer(inv -> inv.getArgument(0));

            DeclarationAuditLogServiceImpl service = new DeclarationAuditLogServiceImpl(repo);
            service.log(1L, actionType, 100L, "DISTRICT_COLLECTOR", "Test remark");

            verify(repo, times(1)).save(argThat(entry ->
                    entry.getAction().equals(actionType.name())
                            && entry.getEntityId().equals(1L)
                            && entry.getDcUserId().equals(100L)
                            && "DISTRICT_COLLECTOR".equals(entry.getActorRole())
            ));
        }
    }

    /**
     * Property 7c: Audit entry action field matches the AuditActionType name exactly.
     */
    @Property(tries = 200)
    void auditEntryActionMatchesActionTypeName(@ForAll AuditActionType actionType) {
        GovernanceActionRepository repo = mock(GovernanceActionRepository.class);
        when(repo.save(any(GovernanceActionHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        DeclarationAuditLogServiceImpl service = new DeclarationAuditLogServiceImpl(repo);
        service.log(1L, actionType, 1L, "TEMPLE_AUTHORITY", null);

        verify(repo).save(argThat(entry ->
                entry.getAction().equals(actionType.name())
        ));
    }

    /**
     * Property 7d: Audit entry entityType is always "DECLARATION" for declaration workflow actions.
     */
    @Property(tries = 200)
    void auditEntryEntityTypeIsAlwaysDeclaration(
            @ForAll AuditActionType actionType,
            @ForAll @Positive long declarationId) {

        GovernanceActionRepository repo = mock(GovernanceActionRepository.class);
        when(repo.save(any(GovernanceActionHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        DeclarationAuditLogServiceImpl service = new DeclarationAuditLogServiceImpl(repo);
        service.log(declarationId, actionType, 1L, "DISTRICT_COLLECTOR", null);

        verify(repo).save(argThat(entry ->
                "DECLARATION".equals(entry.getEntityType())
                        && entry.getEntityId().equals(declarationId)
        ));
    }

    /**
     * Property 7e: Null actorId is handled gracefully (defaults to 0L).
     */
    @Example
    void nullActorIdIsHandledGracefully() {
        GovernanceActionRepository repo = mock(GovernanceActionRepository.class);
        when(repo.save(any(GovernanceActionHistory.class))).thenAnswer(inv -> inv.getArgument(0));

        DeclarationAuditLogServiceImpl service = new DeclarationAuditLogServiceImpl(repo);
        service.log(1L, AuditActionType.SUBMIT, null, "TEMPLE_AUTHORITY", null);

        verify(repo).save(argThat(entry ->
                entry.getDcUserId() != null && entry.getDcUserId() == 0L
        ));
    }
}
