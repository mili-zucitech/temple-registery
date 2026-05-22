package com.templeregistry.controller.declaration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.response.declaration.CompleteDeclarationResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.service.governance.GovernanceWorkflowService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = DeclarationController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class DeclarationControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ScopeHelper scopeHelper;
    @MockBean DeclarationService declarationService;
    @MockBean GovernanceWorkflowService governanceWorkflowService;

    private CompleteDeclarationResponse buildCompleteResponse() {
        return CompleteDeclarationResponse.builder()
                .id(1L)
                .templeId(10L)
                .build();
    }

    // ── GET /api/v1/temples/{templeId}/declarations ───────────────────────────

    @Nested
    class List_ {

        @Test
        void should_return200WithPage_when_declarationsExist() throws Exception {
            org.springframework.data.domain.Page<DeclarationResponse> emptyPage =
                    new org.springframework.data.domain.PageImpl<>(Collections.emptyList());
            when(declarationService.listByTemple(10L, 0, 10))
                    .thenReturn(PaginatedResponse.of(emptyPage));

            mockMvc.perform(get("/api/v1/temples/10/declarations"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── POST /api/v1/temples/{templeId}/declarations ──────────────────────────

    @Nested
    class Create {

        @Test
        void should_return201_when_declarationCreated() throws Exception {
            when(declarationService.create(anyLong(), any())).thenReturn(buildCompleteResponse());

            String body = """
                    {"financialYear":"2024-25","dueDate":"2025-03-31"}
                    """;

            mockMvc.perform(post("/api/v1/temples/10/declarations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── GET /api/v1/declarations/{id} ─────────────────────────────────────────

    @Nested
    class GetById {

        @Test
        void should_return200_when_declarationFound() throws Exception {
            when(declarationService.getById(1L)).thenReturn(buildCompleteResponse());

            mockMvc.perform(get("/api/v1/declarations/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // ── PUT /api/v1/declarations/{id} ─────────────────────────────────────────

    @Nested
    class Update {

        @Test
        void should_return200_when_declarationUpdated() throws Exception {
            when(declarationService.update(anyLong(), any())).thenReturn(buildCompleteResponse());

            mockMvc.perform(put("/api/v1/declarations/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"financialYear\":\"2024-25\",\"dueDate\":\"2025-03-31\"}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── POST /api/v1/declarations/{id}/submit (deprecated shim) ──────────────

    @Nested
    class Submit {

        @Test
        void should_return200_when_declarationSubmitted() throws Exception {
            doNothing().when(governanceWorkflowService).submitDeclaration(1L);

            mockMvc.perform(post("/api/v1/declarations/1/submit"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
