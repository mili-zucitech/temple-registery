package com.templeregistry.service.impl;

import com.templeregistry.dto.response.declaration.ChatActor;
import com.templeregistry.dto.response.declaration.ChatMessage;
import com.templeregistry.dto.response.declaration.ChatMessageType;
import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.declaration.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConversationServiceImpl implements ConversationService {

    private static final Set<String> SITE_VISIT_ACTIONS = Set.of(
            AuditActionType.SITE_VISIT_SCHEDULED.name(),
            AuditActionType.SITE_VISIT_COMPLETED.name()
    );

    private final DeclarationClarificationRepository declarationClarificationRepository;
    private final GovernanceActionRepository governanceActionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessage> assembleConversation(Long declarationId) {
        List<DeclarationClarification> clarifications =
                declarationClarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(declarationId);

        List<GovernanceActionHistory> governanceRecords =
                governanceActionRepository.findByEntityTypeAndEntityIdOrderByTimestampAsc("DECLARATION", declarationId);

        List<ChatMessage> messages = new ArrayList<>();

        for (DeclarationClarification source : clarifications) {
            ChatMessageType type;
            ChatActor actor;
            if (source.getDirection() == ClarificationDirection.DC_TO_TEMPLE) {
                type = ChatMessageType.CLARIFICATION;
                actor = ChatActor.DC;
            } else {
                type = ChatMessageType.RESPONSE;
                actor = ChatActor.TA;
            }
            messages.add(new ChatMessage(
                    "clarification-" + source.getId(),
                    type,
                    actor,
                    source.getMessage(),
                    source.getCreatedAt(),
                    null
            ));
        }

        // Filter to site visit records only
        List<GovernanceActionHistory> siteVisitRecords = governanceRecords.stream()
                .filter(r -> SITE_VISIT_ACTIONS.contains(r.getAction()))
                .collect(java.util.stream.Collectors.toList());

        // Deduplicate by composite key (action, entityId, timestamp) — keeps first occurrence
        Map<String, GovernanceActionHistory> deduped = new LinkedHashMap<>();
        for (GovernanceActionHistory record : siteVisitRecords) {
            String key = record.getAction() + "|" + record.getEntityId() + "|" + record.getTimestamp();
            deduped.putIfAbsent(key, record);
        }
        List<GovernanceActionHistory> uniqueSiteVisits = new ArrayList<>(deduped.values());

        for (GovernanceActionHistory source : uniqueSiteVisits) {
            String messageText = AuditActionType.SITE_VISIT_SCHEDULED.name().equals(source.getAction())
                    ? "Site Visit Scheduled"
                    : "Site Visit Completed";
            messages.add(new ChatMessage(
                    "site-visit-" + source.getId(),
                    ChatMessageType.SITE_VISIT,
                    ChatActor.DC,
                    messageText,
                    source.getTimestamp(),
                    source.getComment()
            ));
        }

        messages.sort(Comparator.comparing(ChatMessage::timestamp));

        return messages;
    }
}
