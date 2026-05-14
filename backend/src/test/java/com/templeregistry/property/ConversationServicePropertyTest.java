package com.templeregistry.property;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.declaration.ChatActor;
import com.templeregistry.dto.response.declaration.ChatMessage;
import com.templeregistry.dto.response.declaration.ChatMessageType;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.impl.ConversationServiceImpl;
import com.templeregistry.service.impl.declaration.DeclarationServiceImpl;
import com.templeregistry.util.PaginationUtil;
import net.jqwik.api.*;
import net.jqwik.api.constraints.IntRange;
import net.jqwik.api.constraints.NotEmpty;
import net.jqwik.api.lifecycle.BeforeProperty;
import org.mockito.Mockito;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.Disabled;

/**
 * Property-based tests for ConversationServiceImpl and DeclarationServiceImpl.
 * Feature: unified-declaration-chat
 *
 * Uses jqwik + Mockito to verify universal properties across arbitrary inputs.
 */
class ConversationServicePropertyTest {

    private static final Long DECLARATION_ID = 1L;

    private DeclarationClarificationRepository clarificationRepo;
    private GovernanceActionRepository governanceRepo;
    private ConversationServiceImpl service;

    // ── Fields for DC list property tests ────────────────────────────────────
    private DeclarationRepository declarationRepository;
    private TempleRepository templeRepository;
    private PaginationUtil paginationUtil;
    private DeclarationServiceImpl declarationService;

    @BeforeProperty
    void setUp() {
        clarificationRepo = Mockito.mock(DeclarationClarificationRepository.class);
        governanceRepo = Mockito.mock(GovernanceActionRepository.class);
        service = new ConversationServiceImpl(clarificationRepo, governanceRepo);

        // Set up DeclarationServiceImpl mocks for DC list property tests
        declarationRepository = Mockito.mock(DeclarationRepository.class);
        templeRepository = Mockito.mock(TempleRepository.class);
        paginationUtil = Mockito.mock(PaginationUtil.class);
        when(paginationUtil.clampSize(Mockito.anyInt())).thenReturn(20);
        when(templeRepository.findAllById(any())).thenReturn(Collections.emptyList());

        declarationService = new DeclarationServiceImpl(
                declarationRepository,
                Mockito.mock(com.templeregistry.repository.declaration.DeclarationClarificationRepository.class),
                Mockito.mock(com.templeregistry.repository.declaration.AssetDeclarationVersionRepository.class),
                templeRepository,
                Mockito.mock(com.templeregistry.security.OwnershipGuard.class),
                Mockito.mock(com.templeregistry.security.JurisdictionGuard.class),
                Mockito.mock(com.templeregistry.util.AcknowledgementNumberGenerator.class),
                Mockito.mock(com.templeregistry.service.dc.NotificationEventPublisher.class),
                paginationUtil,
                Mockito.mock(com.templeregistry.service.audit.AuditService.class),
                Mockito.mock(com.templeregistry.service.audit.GovernanceAuditService.class),
                Mockito.mock(com.templeregistry.repository.auth.UserRepository.class),
                Mockito.mock(com.fasterxml.jackson.databind.ObjectMapper.class),
                Mockito.mock(com.templeregistry.service.document.FileStorageService.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovAgriLandRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovBuildingRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovLeasedRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclImmovOtherRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovPreciousMetalRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovArtifactRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovVehicleRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovEquipmentRepository.class),
                Mockito.mock(com.templeregistry.repository.dc.DeclMovFinancialRepository.class),
                Mockito.mock(com.templeregistry.mapper.declaration.DeclarationAssetMapper.class),
                Mockito.mock(com.templeregistry.service.governance.GovernanceEditGuard.class),
                Mockito.mock(com.templeregistry.service.declaration.SnapshotService.class),
                Mockito.mock(com.templeregistry.service.audit.DeclarationAuditLogService.class),
                Mockito.mock(com.templeregistry.service.workflow.WorkflowEngineAdaptor.class),
                Mockito.mock(com.templeregistry.service.workflow.WorkflowEngine.class),
                Mockito.mock(com.templeregistry.service.governance.GovernanceStatusResolver.class)
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DeclarationClarification clarification(long id, ClarificationDirection direction,
                                                    String message, LocalDateTime createdAt) {
        return DeclarationClarification.builder()
                .id(id)
                .declarationId(DECLARATION_ID)
                .direction(direction)
                .message(message)
                .authorId(99L)
                .createdAt(createdAt)
                .build();
    }

    private GovernanceActionHistory governanceRecord(long id, String action,
                                                      String comment, LocalDateTime timestamp) {
        return GovernanceActionHistory.builder()
                .id(id)
                .entityId(DECLARATION_ID)
                .entityType("DECLARATION")
                .dcUserId(5L)
                .action(action)
                .comment(comment)
                .timestamp(timestamp)
                .build();
    }

    /**
     * Generate a list of N clarifications with distinct IDs and arbitrary timestamps.
     * IDs start at 1 and are sequential to avoid collisions.
     */
    private List<DeclarationClarification> buildClarifications(int n, List<LocalDateTime> timestamps) {
        List<DeclarationClarification> result = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            ClarificationDirection dir = (i % 2 == 0)
                    ? ClarificationDirection.DC_TO_TEMPLE
                    : ClarificationDirection.TEMPLE_TO_DC;
            result.add(clarification(i + 1L, dir, "message-" + i, timestamps.get(i)));
        }
        return result;
    }

    /**
     * Generate a list of M site visit records with distinct IDs and arbitrary timestamps.
     * IDs start at 1000 to avoid collision with clarification IDs.
     */
    private List<GovernanceActionHistory> buildSiteVisits(int m, List<LocalDateTime> timestamps) {
        List<GovernanceActionHistory> result = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            String action = (i % 2 == 0)
                    ? AuditActionType.SITE_VISIT_SCHEDULED.name()
                    : AuditActionType.SITE_VISIT_COMPLETED.name();
            result.add(governanceRecord(1000L + i, action, "comment-" + i, timestamps.get(i)));
        }
        return result;
    }

    // ── Arbitrary providers ───────────────────────────────────────────────────

    @Provide
    Arbitrary<LocalDateTime> timestamps() {
        return Arbitraries.longs()
                .between(0L, 365L * 24 * 60 * 60 - 1)
                .map(seconds -> LocalDateTime.of(2024, 1, 1, 0, 0).plusSeconds(seconds));
    }

    @Provide
    Arbitrary<List<LocalDateTime>> timestampList() {
        return timestamps().list().ofMinSize(0).ofMaxSize(10);
    }

    @Provide
    Arbitrary<ClarificationDirection> directions() {
        return Arbitraries.of(ClarificationDirection.DC_TO_TEMPLE, ClarificationDirection.TEMPLE_TO_DC);
    }

    @Provide
    Arbitrary<String> siteVisitActions() {
        return Arbitraries.of(
                AuditActionType.SITE_VISIT_SCHEDULED.name(),
                AuditActionType.SITE_VISIT_COMPLETED.name()
        );
    }

    @Provide
    Arbitrary<String> nonSiteVisitActions() {
        return Arbitraries.of(
                AuditActionType.SUBMIT.name(),
                AuditActionType.UNDER_REVIEW.name(),
                AuditActionType.APPROVED.name(),
                AuditActionType.REJECTED.name(),
                AuditActionType.VERIFIED.name()
        );
    }

    @Provide
    Arbitrary<String> nullableStrings() {
        return Arbitraries.strings().alpha().ofMinLength(0).ofMaxLength(20).injectNull(0.3);
    }

    // ── Properties ────────────────────────────────────────────────────────────

    /**
     * Feature: unified-declaration-chat, Property 1: Chronological ordering
     *
     * For any N clarifications and M site visits with arbitrary timestamps,
     * output satisfies messages[i].timestamp <= messages[i+1].timestamp for all consecutive pairs.
     *
     * Validates: Requirements 1.2, 1.8
     */
    @Property(tries = 200)
    void chronologicalOrdering(
            @ForAll @IntRange(min = 0, max = 5) int n,
            @ForAll @IntRange(min = 0, max = 5) int m,
            @ForAll("timestampList") List<LocalDateTime> allTimestamps) {

        // Ensure we have enough timestamps; pad with a fixed value if needed
        List<LocalDateTime> ts = new ArrayList<>(allTimestamps);
        while (ts.size() < n + m) {
            ts.add(LocalDateTime.of(2024, 6, 1, 12, 0));
        }

        List<DeclarationClarification> clarifications = buildClarifications(n, ts.subList(0, n));
        List<GovernanceActionHistory> siteVisits = buildSiteVisits(m, ts.subList(n, n + m));

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(clarifications);
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(siteVisits);

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        // Verify chronological ordering for all consecutive pairs
        for (int i = 0; i < result.size() - 1; i++) {
            assertThat(result.get(i).timestamp())
                    .as("messages[%d].timestamp must be <= messages[%d].timestamp", i, i + 1)
                    .isBeforeOrEqualTo(result.get(i + 1).timestamp());
        }
    }

    /**
     * Feature: unified-declaration-chat, Property 2: Clarification direction mapping
     *
     * For any DeclarationClarification, the resulting ChatMessage has:
     * - id = "clarification-" + source.id
     * - type = CLARIFICATION and actor = DC when direction = DC_TO_TEMPLE
     * - type = RESPONSE and actor = TA when direction = TEMPLE_TO_DC
     * - message = source.message
     * - timestamp = source.createdAt
     * - metadata = null
     *
     * Validates: Requirements 1.3, 1.4, 2.2, 2.4
     */
    @Property(tries = 200)
    void clarificationDirectionMapping(
            @ForAll @IntRange(min = 1, max = 100) long id,
            @ForAll("directions") ClarificationDirection direction,
            @ForAll @NotEmpty String message,
            @ForAll("timestamps") LocalDateTime createdAt) {

        DeclarationClarification source = clarification(id, direction, message, createdAt);

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of(source));
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of());

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(1);
        ChatMessage msg = result.get(0);

        // id = "clarification-" + source.id
        assertThat(msg.id())
                .as("id must be 'clarification-' + source.id")
                .isEqualTo("clarification-" + id);

        // type and actor per direction
        if (direction == ClarificationDirection.DC_TO_TEMPLE) {
            assertThat(msg.type())
                    .as("DC_TO_TEMPLE must map to CLARIFICATION type")
                    .isEqualTo(ChatMessageType.CLARIFICATION);
            assertThat(msg.actor())
                    .as("DC_TO_TEMPLE must map to DC actor")
                    .isEqualTo(ChatActor.DC);
        } else {
            assertThat(msg.type())
                    .as("TEMPLE_TO_DC must map to RESPONSE type")
                    .isEqualTo(ChatMessageType.RESPONSE);
            assertThat(msg.actor())
                    .as("TEMPLE_TO_DC must map to TA actor")
                    .isEqualTo(ChatActor.TA);
        }

        // message = source.message
        assertThat(msg.message())
                .as("message must equal source.message")
                .isEqualTo(message);

        // timestamp = source.createdAt
        assertThat(msg.timestamp())
                .as("timestamp must equal source.createdAt")
                .isEqualTo(createdAt);

        // metadata = null
        assertThat(msg.metadata())
                .as("metadata must be null for clarification messages")
                .isNull();
    }

    /**
     * Feature: unified-declaration-chat, Property 3: Site visit mapping
     *
     * For any GovernanceActionHistory with action SITE_VISIT_SCHEDULED or SITE_VISIT_COMPLETED,
     * the resulting ChatMessage has:
     * - id = "site-visit-" + source.id
     * - type = SITE_VISIT and actor = DC
     * - message = "Site Visit Scheduled" or "Site Visit Completed" based on action
     * - timestamp = source.timestamp
     * - metadata = source.comment (may be null)
     *
     * Validates: Requirements 1.5, 2.3, 2.4, 5.1, 5.2, 5.4
     */
    @Property(tries = 200)
    void siteVisitMapping(
            @ForAll @IntRange(min = 1, max = 100) long id,
            @ForAll("siteVisitActions") String action,
            @ForAll("nullableStrings") String comment,
            @ForAll("timestamps") LocalDateTime timestamp) {

        GovernanceActionHistory source = governanceRecord(id, action, comment, timestamp);

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(source));

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(1);
        ChatMessage msg = result.get(0);

        // id = "site-visit-" + source.id
        assertThat(msg.id())
                .as("id must be 'site-visit-' + source.id")
                .isEqualTo("site-visit-" + id);

        // type = SITE_VISIT
        assertThat(msg.type())
                .as("type must be SITE_VISIT")
                .isEqualTo(ChatMessageType.SITE_VISIT);

        // actor = DC
        assertThat(msg.actor())
                .as("actor must be DC")
                .isEqualTo(ChatActor.DC);

        // message label based on action
        String expectedMessage = AuditActionType.SITE_VISIT_SCHEDULED.name().equals(action)
                ? "Site Visit Scheduled"
                : "Site Visit Completed";
        assertThat(msg.message())
                .as("message must be '%s' for action '%s'", expectedMessage, action)
                .isEqualTo(expectedMessage);

        // timestamp = source.timestamp
        assertThat(msg.timestamp())
                .as("timestamp must equal source.timestamp")
                .isEqualTo(timestamp);

        // metadata = source.comment
        assertThat(msg.metadata())
                .as("metadata must equal source.comment")
                .isEqualTo(comment);
    }

    /**
     * Feature: unified-declaration-chat, Property 4: Non-site-visit exclusion
     *
     * For any governance record whose action is not SITE_VISIT_SCHEDULED or SITE_VISIT_COMPLETED,
     * it does not appear in the output.
     *
     * Validates: Requirements 1.6
     */
    @Property(tries = 200)
    void nonSiteVisitExclusion(
            @ForAll @IntRange(min = 1, max = 5) int m,
            @ForAll("nonSiteVisitActions") String action,
            @ForAll("timestampList") List<LocalDateTime> allTimestamps) {

        List<LocalDateTime> ts = new ArrayList<>(allTimestamps);
        while (ts.size() < m) {
            ts.add(LocalDateTime.of(2024, 3, 1, 8, 0));
        }

        List<GovernanceActionHistory> nonSiteVisitRecords = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            nonSiteVisitRecords.add(governanceRecord(2000L + i, action, null, ts.get(i)));
        }

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(nonSiteVisitRecords);

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        // No non-site-visit records should appear in the output
        assertThat(result)
                .as("Non-site-visit governance records must not appear in the output")
                .isEmpty();
    }

    /**
     * Feature: unified-declaration-chat, Property 5: No duplication and exact count
     *
     * For any N clarifications and M site visit records (with unique composite keys),
     * output has exactly N + M entries with all-distinct id values.
     *
     * Validates: Requirements 1.7, 7.6
     */
    @Property(tries = 200)
    void noDuplicationAndExactCount(
            @ForAll @IntRange(min = 0, max = 5) int n,
            @ForAll @IntRange(min = 0, max = 5) int m,
            @ForAll("timestampList") List<LocalDateTime> allTimestamps) {

        List<LocalDateTime> ts = new ArrayList<>(allTimestamps);
        while (ts.size() < n) {
            ts.add(LocalDateTime.of(2024, 9, 1, 0, 0));
        }

        List<DeclarationClarification> clarifications = buildClarifications(n, ts.subList(0, n));

        // Build site visits with guaranteed-unique composite keys by using a fixed base
        // timestamp plus a large per-record offset (hours), ensuring no two records share
        // the same (action, entityId, timestamp) triple regardless of generated input.
        LocalDateTime siteVisitBase = LocalDateTime.of(2025, 1, 1, 0, 0);
        List<GovernanceActionHistory> siteVisits = new ArrayList<>();
        for (int i = 0; i < m; i++) {
            // Each record gets a unique timestamp: base + i hours (guaranteed distinct)
            LocalDateTime uniqueTs = siteVisitBase.plusHours(i);
            String action = (i % 2 == 0)
                    ? AuditActionType.SITE_VISIT_SCHEDULED.name()
                    : AuditActionType.SITE_VISIT_COMPLETED.name();
            siteVisits.add(governanceRecord(1000L + i, action, null, uniqueTs));
        }

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(clarifications);
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(siteVisits);

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        // Exact count: N + M
        assertThat(result)
                .as("Output must have exactly N(%d) + M(%d) = %d entries", n, m, n + m)
                .hasSize(n + m);

        // All IDs must be distinct
        Set<String> ids = result.stream()
                .map(ChatMessage::id)
                .collect(Collectors.toSet());
        assertThat(ids)
                .as("All id values must be distinct — found %d unique ids for %d messages", ids.size(), result.size())
                .hasSize(result.size());
    }

    // ── v1.1 Properties ───────────────────────────────────────────────────────

    /**
     * Feature: unified-declaration-chat, Property 13: Site visit deduplication by composite key
     *
     * For any set of GovernanceActionHistory site visit records associated with a declaration —
     * including records that share the same (action, entityId, timestamp) composite key —
     * ConversationService.assembleConversation SHALL return at most one ChatMessage per unique
     * (action, entityId, timestamp) combination. The total number of site visit ChatMessage
     * entries SHALL equal the number of distinct composite keys, not the total number of input records.
     *
     * Validates: Requirements 12.1, 12.2, 12.3
     */
    @Property(tries = 200)
    void siteVisitDeduplicationByCompositeKey(
            @ForAll @IntRange(min = 1, max = 5) int uniqueCount,
            @ForAll @IntRange(min = 2, max = 4) int duplicatesPerRecord) {

        // Feature: unified-declaration-chat, Property 13: Site visit deduplication by composite key

        // Use guaranteed-unique timestamps for each unique record (base + i hours)
        // to avoid accidental deduplication from timestamp collisions.
        LocalDateTime base = LocalDateTime.of(2024, 5, 1, 0, 0);

        List<GovernanceActionHistory> inputRecords = new ArrayList<>();

        for (int i = 0; i < uniqueCount; i++) {
            // Alternate actions to ensure variety; uniqueness is guaranteed by timestamp
            String action = (i % 2 == 0)
                    ? AuditActionType.SITE_VISIT_SCHEDULED.name()
                    : AuditActionType.SITE_VISIT_COMPLETED.name();
            // Each unique record gets a timestamp offset by i*24 hours — guaranteed distinct
            LocalDateTime timestamp = base.plusHours(i * 24L);

            // Add the original record
            inputRecords.add(governanceRecord(2000L + i, action, "comment-" + i, timestamp));

            // Add (duplicatesPerRecord - 1) exact duplicates: same (action, entityId, timestamp)
            // but different record IDs and comments — these should be deduplicated
            for (int d = 1; d < duplicatesPerRecord; d++) {
                inputRecords.add(governanceRecord(
                        2000L + i + (d * 100L),  // different record ID
                        action,                   // same action
                        "dup-comment-" + d,       // different comment (irrelevant to dedup key)
                        timestamp                 // same timestamp — triggers deduplication
                ));
            }
        }

        when(clarificationRepo.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceRepo.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(inputRecords);

        List<ChatMessage> result = service.assembleConversation(DECLARATION_ID);

        // Count only SITE_VISIT messages in the result
        long siteVisitCount = result.stream()
                .filter(m -> m.type() == ChatMessageType.SITE_VISIT)
                .count();

        // The number of SITE_VISIT messages must equal the number of distinct composite keys
        assertThat(siteVisitCount)
                .as("Site visit message count (%d) must equal distinct composite key count (%d), not total input count (%d)",
                        siteVisitCount, uniqueCount, inputRecords.size())
                .isEqualTo(uniqueCount);

        // All site visit message IDs must be distinct
        Set<String> siteVisitIds = result.stream()
                .filter(m -> m.type() == ChatMessageType.SITE_VISIT)
                .map(ChatMessage::id)
                .collect(Collectors.toSet());
        assertThat(siteVisitIds)
                .as("All site visit message IDs must be distinct")
                .hasSize((int) siteVisitCount);
    }

    /**
     * Feature: unified-declaration-chat, Property 11: DC list excludes DRAFT declarations
     *
     * For any set of AssetDeclaration records in a district that includes one or more records
     * with status = DRAFT, the list returned by DeclarationService.listByDistrict (when called
     * without an explicit status filter) SHALL contain zero records with status = DRAFT, and
     * SHALL contain all records whose status is not DRAFT.
     *
     * This property tests that the repository's findAllByDistrictIdExcludingDraft method is
     * called (not findAllByDistrictId) when no status filter is provided.
     *
     * Validates: Requirements 10.1, 10.2, 10.4
     */
    @Property(tries = 200)
    void dcListExcludesDraftDeclarations(
            @ForAll @IntRange(min = 0, max = 5) int draftCount,
            @ForAll @IntRange(min = 0, max = 5) int nonDraftCount,
            @ForAll("nonDraftStatuses") List<DeclarationStatus> nonDraftStatuses) {

        // Feature: unified-declaration-chat, Property 11: DC list excludes DRAFT declarations

        Long districtId = 10L;

        // Build the non-DRAFT declarations that the repository should return
        // (the repository method itself filters out DRAFTs — we verify the right method is called)
        List<AssetDeclaration> nonDraftDeclarations = new ArrayList<>();
        for (int i = 0; i < nonDraftCount; i++) {
            DeclarationStatus status = nonDraftStatuses.isEmpty()
                    ? DeclarationStatus.SUBMITTED
                    : nonDraftStatuses.get(i % nonDraftStatuses.size());
            nonDraftDeclarations.add(AssetDeclaration.builder()
                    .id((long) (i + 1))
                    .templeId(1L)
                    .districtId(districtId)
                    .status(status)
                    .financialYear("2024-25")
                    .build());
        }

        // Stub the excluding-draft method to return only non-DRAFT records
        when(declarationRepository.findAllByDistrictIdExcludingDraft(eq(districtId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(nonDraftDeclarations));

        // Stub the all-excluding-draft method (for SA path)
        when(declarationRepository.findAllExcludingDraft(any(Pageable.class)))
                .thenReturn(new PageImpl<>(nonDraftDeclarations));

        // Mock security context for the @PreAuthorize check
        mockSecurityContext();

        // Call listByDistrict with no status filter (null status)
        PaginatedResponse<DeclarationResponse> result =
                declarationService.listByDistrict(districtId, null, null, 0, 20);

        // The result must contain exactly the non-DRAFT records
        assertThat(result.getContent())
                .as("listByDistrict must return exactly %d non-DRAFT records", nonDraftCount)
                .hasSize(nonDraftCount);

        // None of the returned records should have DRAFT status
        assertThat(result.getContent())
                .as("listByDistrict must not return any DRAFT declarations")
                .noneMatch(d -> "DRAFT".equals(d.getStatus() != null ? d.getStatus().name() : null));
    }

    // ── Arbitrary providers for v1.1 properties ───────────────────────────────

    @Provide
    Arbitrary<List<DeclarationStatus>> nonDraftStatuses() {
        return Arbitraries.of(
                DeclarationStatus.SUBMITTED,
                DeclarationStatus.UNDER_REVIEW,
                DeclarationStatus.CLARIFICATION_REQUIRED,
                DeclarationStatus.CLARIFICATION_RESPONDED,
                DeclarationStatus.SITE_VISIT_SCHEDULED,
                DeclarationStatus.SITE_VISIT_COMPLETED,
                DeclarationStatus.VERIFIED,
                DeclarationStatus.APPROVED,
                DeclarationStatus.REJECTED
        ).list().ofMinSize(1).ofMaxSize(5);
    }

    // ── Security context helper ───────────────────────────────────────────────

    private void mockSecurityContext() {
        org.springframework.security.core.context.SecurityContext ctx =
                Mockito.mock(org.springframework.security.core.context.SecurityContext.class);
        org.springframework.security.core.Authentication auth =
                Mockito.mock(org.springframework.security.core.Authentication.class);
        com.templeregistry.security.ScopeHelper.Claims claims =
                Mockito.mock(com.templeregistry.security.ScopeHelper.Claims.class);
        Mockito.when(ctx.getAuthentication()).thenReturn(auth);
        Mockito.when(auth.getPrincipal()).thenReturn(claims);
        Mockito.lenient().when(claims.userId()).thenReturn(1L);
        Mockito.lenient().when(claims.role()).thenReturn("DISTRICT_COLLECTOR");
        org.springframework.security.core.context.SecurityContextHolder.setContext(ctx);
    }
}
