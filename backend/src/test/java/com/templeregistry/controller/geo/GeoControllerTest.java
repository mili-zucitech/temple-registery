package com.templeregistry.controller.geo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.response.geo.DistrictResponse;
import com.templeregistry.dto.response.geo.StateResponse;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.geo.GeoService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = GeoController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class GeoControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean GeoService geoService;
    @MockBean ScopeHelper scopeHelper;

    // ── GET /api/v1/geo/states ───────────────────────────────────────────────

    @Nested
    class ListStates {

        @Test
        void should_return200WithStates_when_statesExist() throws Exception {
            List<StateResponse> states = List.of(
                StateResponse.builder().id(1L).name("Karnataka").code("KA").build(),
                StateResponse.builder().id(2L).name("Tamil Nadu").code("TN").build()
            );
            when(geoService.listStates()).thenReturn(states);

            mockMvc.perform(get("/api/v1/geo/states"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].name").value("Karnataka"));
        }

        @Test
        void should_return200WithEmptyList_when_noStatesExist() throws Exception {
            when(geoService.listStates()).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/geo/states"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
        }
    }

    // ── GET /api/v1/geo/districts ────────────────────────────────────────────

    @Nested
    class ListAllDistricts {

        @Test
        void should_return200WithDistricts_when_districtsExist() throws Exception {
            List<DistrictResponse> districts = List.of(
                DistrictResponse.builder().id(1L).name("Bengaluru Urban").build(),
                DistrictResponse.builder().id(2L).name("Mysuru").build()
            );
            when(geoService.listAllDistricts()).thenReturn(districts);

            mockMvc.perform(get("/api/v1/geo/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(2));
        }
    }

    // ── GET /api/v1/geo/states/{stateId}/cities ──────────────────────────────

    @Nested
    class ListCities {

        @Test
        void should_return200_when_stateIdValid() throws Exception {
            when(geoService.listCitiesByState(1L)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/geo/states/1/cities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── GET /api/v1/geo/states/{stateId}/districts ───────────────────────────

    @Nested
    class ListDistrictsByState {

        @Test
        void should_return200_when_stateIdValid() throws Exception {
            when(geoService.listDistrictsByState(1L)).thenReturn(List.of());

            mockMvc.perform(get("/api/v1/geo/states/1/districts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ── POST /api/v1/geo/states ──────────────────────────────────────────────

    @Nested
    class CreateState {

        @Test
        void should_return201_when_superAdminCreatesState() throws Exception {
            StateResponse created = StateResponse.builder().id(3L).name("Kerala").code("KL").build();
            when(geoService.createState(any())).thenReturn(created);

            mockMvc.perform(post("/api/v1/geo/states")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Kerala\",\"code\":\"KL\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Kerala"));
        }

        @Test
        void should_return201_when_stateCreatedSuccessfully() throws Exception {
            StateResponse created = StateResponse.builder().id(4L).name("Telangana").code("TS").build();
            when(geoService.createState(any())).thenReturn(created);

            mockMvc.perform(post("/api/v1/geo/states")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"Telangana\",\"code\":\"TS\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
        }
    }
}
