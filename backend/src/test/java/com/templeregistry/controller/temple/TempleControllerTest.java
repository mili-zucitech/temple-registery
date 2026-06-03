package com.templeregistry.controller.temple;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.CreateTempleRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.temple.TempleSearchResultResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.temple.TempleService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = TempleController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class TempleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean TempleService templeService;
    @MockBean TempleProfileStagingService stagingService;
    @MockBean ScopeHelper scopeHelper;

    // ── GET /api/v1/temples ──────────────────────────────────────────────────

    @Nested
    class Search {

        @Test
        void should_return200WithResults_when_searchPerformed() throws Exception {
            PaginatedResponse<TempleSearchResultResponse> page = PaginatedResponse.of(
                new PageImpl<>(List.of(TempleSearchResultResponse.builder().id(1L).name("Shiva Temple").build()),
                    PageRequest.of(0, 10), 1L)
            );
            when(templeService.search(any())).thenReturn(page);

            mockMvc.perform(get("/api/v1/temples"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].name").value("Shiva Temple"));
        }

        @Test
        void should_return200WithEmptyPage_when_noTemplesFound() throws Exception {
            PaginatedResponse<TempleSearchResultResponse> emptyPage = PaginatedResponse.of(
                new PageImpl<>(List.of(), PageRequest.of(0, 10), 0L)
            );
            when(templeService.search(any())).thenReturn(emptyPage);

            mockMvc.perform(get("/api/v1/temples"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
        }

        @Test
        void should_return200_when_unauthenticated() throws Exception {
            when(templeService.search(any())).thenReturn(PaginatedResponse.of(new PageImpl<>(List.of(), PageRequest.of(0, 10), 0L)));

            // Temple search is public
            mockMvc.perform(get("/api/v1/temples"))
                .andExpect(status().isOk());
        }
    }

    // ── POST /api/v1/temples ─────────────────────────────────────────────────

    @Nested
    class Create {

        @Test
        void should_return201_when_templeCreated() throws Exception {
            TempleResponse response = TempleResponse.builder()
                .id(1L)
                .name("New Temple")
                .build();
            when(templeService.create(any())).thenReturn(response);

            mockMvc.perform(post("/api/v1/temples")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"New Temple\",\"registrationNumber\":\"TRM/A/001\",\"grade\":\"A\",\"primaryDeity\":\"Shiva\",\"districtId\":1}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("New Temple"));
        }
    }

    // ── GET /api/v1/temples/{id} ─────────────────────────────────────────────

    @Nested
    class GetById {

        @Test
        void should_return200WithTemple_when_templeFound() throws Exception {
            TempleResponse response = TempleResponse.builder()
                .id(42L)
                .name("Venkateswara Temple")
                .build();
            when(templeService.getById(42L)).thenReturn(response);

            mockMvc.perform(get("/api/v1/temples/42"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(42))
                .andExpect(jsonPath("$.data.name").value("Venkateswara Temple"));
        }
    }

    // ── PUT /api/v1/temples/{id} ─────────────────────────────────────────────

    @Nested
    class Update {

        @Test
        void should_return200_when_templeUpdated() throws Exception {
            TempleResponse response = TempleResponse.builder()
                .id(1L)
                .name("Updated Temple Name")
                .build();
            when(templeService.update(eq(1L), any())).thenReturn(response);

            mockMvc.perform(put("/api/v1/temples/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Updated Temple Name\",\"districtId\":1,\"grade\":\"A\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Temple Name"));
        }
    }
}
