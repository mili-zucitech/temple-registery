package com.templeregistry.service.declaration;

import com.templeregistry.dto.response.declaration.ChatMessage;

import java.util.List;

public interface ConversationService {

    /**
     * Assembles a unified, chronologically ordered list of chat messages
     * for the given declaration by merging clarifications and site visit events.
     * Read-only — no side effects on declaration state.
     *
     * @param declarationId the declaration ID
     * @return merged, sorted list of chat messages
     */
    List<ChatMessage> assembleConversation(Long declarationId);
}
