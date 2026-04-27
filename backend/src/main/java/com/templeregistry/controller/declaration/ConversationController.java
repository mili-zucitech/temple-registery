package com.templeregistry.controller.declaration;

import com.templeregistry.common.ApiResponse;
import com.templeregistry.dto.response.declaration.ChatMessage;
import com.templeregistry.service.declaration.ConversationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
@Tag(name = "Conversation", description = "Unified declaration chat trail")
public class ConversationController {

    private final ConversationService conversationService;

    @GetMapping("/api/v1/declarations/{id}/conversation")
    @Operation(summary = "Get unified conversation trail for a declaration (all authenticated roles)")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getConversation(@PathVariable Long id) {
        List<ChatMessage> messages = conversationService.assembleConversation(id);
        return ResponseEntity.ok(ApiResponse.success("Conversation retrieved.", messages));
    }
}
