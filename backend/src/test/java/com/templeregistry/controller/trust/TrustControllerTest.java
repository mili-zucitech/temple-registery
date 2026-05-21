package com.templeregistry.controller.trust;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.response.trust.BoardMemberGroupResponse;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.trust.TrustType;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.trust.TrustService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = TrustController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class TrustControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ScopeHelper scopeHelper;
    @MockBean TrustService trustService;

    private TrustResponse buildTrustResponse() {
        return TrustResponse.builder()
                .id(1L)
                .templeId(10L)
                .trustName("Sri Venkateswara Trust")
                .trustType(TrustType.SINGLE_TRUSTEE)
                .registrationNumber("TRN/001")
                .build();
    }

    // ── GET /api/v1/temples/{templeId}/trusts ─────────────────────────────────

    @Nested
    class ListByTemple {

        @Test
        void should_return200WithList_when_trustsExist() throws Exception {
            when(trustService.listByTemple(10L)).thenReturn(List.of(buildTrustResponse()));

            mockMvc.perform(get("/api/v1/temples/10/trusts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data[0].trustName").value("Sri Venkateswara Trust"));
        }

        @Test
        void should_return200WithEmptyList_when_noTrustsExist() throws Exception {
            when(trustService.listByTemple(99L)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/temples/99/trusts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data").isArray());
        }
    }

    // ── POST /api/v1/temples/{templeId}/trusts ────────────────────────────────

    @Nested
    class Create {

        @Test
        void should_return201_when_trustCreated() throws Exception {
            when(trustService.create(anyLong(), any())).thenReturn(buildTrustResponse());

            String body = """
                    {"trustName":"Sri Venkateswara Trust","trustType":"SINGLE_TRUSTEE",
                     "registrationNumber":"TRN/001","registeringAuthority":"Registrar",
                     "dateOfRegistration":"2020-01-15","panNumber":"ABCDE1234F",
                     "bankAccountNumber":"123456789012","bankName":"SBI","bankBranch":"MG Road"}
                    """;

            mockMvc.perform(post("/api/v1/temples/10/trusts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.trustName").value("Sri Venkateswara Trust"));
        }

        @Test
        void should_return400_when_requiredFieldsMissing() throws Exception {
            mockMvc.perform(post("/api/v1/temples/10/trusts")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }
    }

    // ── GET /api/v1/trusts/{id} ───────────────────────────────────────────────

    @Nested
    class GetById {

        @Test
        void should_return200WithTrust_when_trustExists() throws Exception {
            when(trustService.getById(1L)).thenReturn(buildTrustResponse());

            mockMvc.perform(get("/api/v1/trusts/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.id").value(1));
        }
    }

    // ── GET /api/v1/trusts/{trustId}/board-members ────────────────────────────

    @Nested
    class ListBoardMembers {

        @Test
        void should_return200_when_boardMembersListed() throws Exception {
            BoardMemberGroupResponse group = BoardMemberGroupResponse.builder()
                    .current(List.of())
                    .past(List.of())
                    .build();
            when(trustService.listBoardMembers(1L, null)).thenReturn(group);

            mockMvc.perform(get("/api/v1/trusts/1/board-members"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── DELETE /api/v1/trusts/{trustId}/board-members/{memberId} ─────────────

    @Nested
    class DeleteBoardMember {

        @Test
        void should_return200_when_boardMemberDeleted() throws Exception {
            doNothing().when(trustService).deleteBoardMember(1L, 5L);

            mockMvc.perform(delete("/api/v1/trusts/1/board-members/5"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
