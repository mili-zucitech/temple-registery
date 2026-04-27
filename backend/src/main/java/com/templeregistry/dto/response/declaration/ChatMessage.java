package com.templeregistry.dto.response.declaration;

import java.time.LocalDateTime;

public record ChatMessage(
        String id,
        ChatMessageType type,
        ChatActor actor,
        String message,
        LocalDateTime timestamp,
        String metadata          // nullable
) {}
