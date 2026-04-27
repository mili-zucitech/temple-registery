package com.templeregistry.service.impl.declaration;

import com.templeregistry.dto.response.declaration.ChatActor;
import com.templeregistry.dto.response.declaration.ChatMessage;
import com.templeregistry.dto.response.declaration.ChatMessageType;
import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.impl.ConversationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ConversationServiceImpl.
 * Validates Requirements 7.1–7.5.
 */
@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    DeclarationClarificationRepository declarationClarificationRepository;

    @Mock
    GovernanceActionRepository governanceActionRepository;

    @InjectMocks
    ConversationServiceImpl conversationService;

    private static final Long DECLARATION_ID = 1L;
    private static final LocalDateTime BASE_TIME = LocalDateTime.of(2024, 1, 1, 10, 0);

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DeclarationClarification clarification(Long id, ClarificationDirection direction,
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

    private GovernanceActionHistory governanceRecord(Long id, String action,
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

    // ── Tests ─────────────────────────────────────────────────────────────────

    /**
     * Req 7.1 — returned list contains entries from both clarification and site visit sources.
     */
    @Test
    void shouldReturnUnifiedChatMessages() {
        DeclarationClarification clarification = clarification(
                1L, ClarificationDirection.DC_TO_TEMPLE, "Please clarify land area.", BASE_TIME);
        GovernanceActionHistory siteVisit = governanceRecord(
                10L, AuditActionType.SITE_VISIT_SCHEDULED.name(), null, BASE_TIME.plusHours(1));

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of(clarification));
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(siteVisit));

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(2);
        assertThat(result).anyMatch(m -> m.type() == ChatMessageType.CLARIFICATION);
        assertThat(result).anyMatch(m -> m.type() == ChatMessageType.SITE_VISIT);
    }

    /**
     * Req 7.2 — DC_TO_TEMPLE maps to CLARIFICATION/DC; TEMPLE_TO_DC maps to RESPONSE/TA.
     */
    @Test
    void shouldIncludeClarificationMessages() {
        DeclarationClarification dcToTemple = clarification(
                1L, ClarificationDirection.DC_TO_TEMPLE, "Clarify land documents.", BASE_TIME);
        DeclarationClarification templeToDc = clarification(
                2L, ClarificationDirection.TEMPLE_TO_DC, "Here are the documents.", BASE_TIME.plusHours(1));

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of(dcToTemple, templeToDc));
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of());

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(2);

        ChatMessage dcMessage = result.stream()
                .filter(m -> m.id().equals("clarification-1"))
                .findFirst()
                .orElseThrow();
        assertThat(dcMessage.type()).isEqualTo(ChatMessageType.CLARIFICATION);
        assertThat(dcMessage.actor()).isEqualTo(ChatActor.DC);

        ChatMessage taMessage = result.stream()
                .filter(m -> m.id().equals("clarification-2"))
                .findFirst()
                .orElseThrow();
        assertThat(taMessage.type()).isEqualTo(ChatMessageType.RESPONSE);
        assertThat(taMessage.actor()).isEqualTo(ChatActor.TA);
    }

    /**
     * Req 7.3 — SITE_VISIT_SCHEDULED and SITE_VISIT_COMPLETED both appear as SITE_VISIT
     * with the correct human-readable message labels.
     */
    @Test
    void shouldIncludeSiteVisitMessages() {
        GovernanceActionHistory scheduled = governanceRecord(
                10L, AuditActionType.SITE_VISIT_SCHEDULED.name(), "Inspector assigned.", BASE_TIME);
        GovernanceActionHistory completed = governanceRecord(
                11L, AuditActionType.SITE_VISIT_COMPLETED.name(), "Inspection done.", BASE_TIME.plusDays(1));

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(scheduled, completed));

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(2);
        assertThat(result).allMatch(m -> m.type() == ChatMessageType.SITE_VISIT);

        ChatMessage scheduledMsg = result.stream()
                .filter(m -> m.id().equals("site-visit-10"))
                .findFirst()
                .orElseThrow();
        assertThat(scheduledMsg.message()).isEqualTo("Site Visit Scheduled");

        ChatMessage completedMsg = result.stream()
                .filter(m -> m.id().equals("site-visit-11"))
                .findFirst()
                .orElseThrow();
        assertThat(completedMsg.message()).isEqualTo("Site Visit Completed");
    }

    /**
     * Req 7.4 — messages are sorted ascending by timestamp regardless of insertion order.
     */
    @Test
    void shouldMaintainCorrectOrder() {
        // Intentionally out-of-order: site visit at T+0, clarification at T-1 hour
        GovernanceActionHistory siteVisit = governanceRecord(
                20L, AuditActionType.SITE_VISIT_SCHEDULED.name(), null, BASE_TIME);
        DeclarationClarification clarification = clarification(
                3L, ClarificationDirection.DC_TO_TEMPLE, "Earlier message.", BASE_TIME.minusHours(1));

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of(clarification));
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(siteVisit));

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        assertThat(result).hasSize(2);
        // First message should be the clarification (earlier timestamp)
        assertThat(result.get(0).id()).isEqualTo("clarification-3");
        assertThat(result.get(1).id()).isEqualTo("site-visit-20");
        // Verify strict ascending order
        for (int i = 0; i < result.size() - 1; i++) {
            assertThat(result.get(i).timestamp())
                    .isBeforeOrEqualTo(result.get(i + 1).timestamp());
        }
    }

    /**
     * Req 12.5 — when two GovernanceActionHistory records share identical (action, entityId, timestamp),
     * only one ChatMessage is returned for that event.
     */
    @Test
    void shouldDeduplicateSiteVisitMessages() {
        LocalDateTime sameTimestamp = BASE_TIME.plusHours(2);
        // Two records with identical (action, entityId, timestamp) — simulates duplicate persistence
        GovernanceActionHistory duplicate1 = governanceRecord(
                40L, AuditActionType.SITE_VISIT_SCHEDULED.name(), "First write.", sameTimestamp);
        GovernanceActionHistory duplicate2 = governanceRecord(
                41L, AuditActionType.SITE_VISIT_SCHEDULED.name(), "Second write.", sameTimestamp);

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(duplicate1, duplicate2));

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        // Only one ChatMessage should be present despite two source records
        assertThat(result).hasSize(1);
        assertThat(result.get(0).type()).isEqualTo(ChatMessageType.SITE_VISIT);
        assertThat(result.get(0).message()).isEqualTo("Site Visit Scheduled");
    }

    /**
     * Req 7.5 — governance records with non-site-visit action types are excluded from the result.
     */
    @Test
    void shouldNotIncludeIrrelevantLogs() {
        GovernanceActionHistory submit = governanceRecord(
                30L, AuditActionType.SUBMIT.name(), null, BASE_TIME);
        GovernanceActionHistory underReview = governanceRecord(
                31L, AuditActionType.UNDER_REVIEW.name(), null, BASE_TIME.plusHours(1));
        GovernanceActionHistory approved = governanceRecord(
                32L, AuditActionType.APPROVED.name(), null, BASE_TIME.plusHours(2));

        when(declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(DECLARATION_ID))
                .thenReturn(List.of());
        when(governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", DECLARATION_ID))
                .thenReturn(List.of(submit, underReview, approved));

        List<ChatMessage> result = conversationService.assembleConversation(DECLARATION_ID);

        assertThat(result).isEmpty();
    }
}
