package com.templeregistry.controller.employee;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.employee.CreateEmployeeRequest;
import com.templeregistry.dto.request.employee.UpdateEmployeeRequest;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.entity.employee.EmployeeStatus;
import com.templeregistry.entity.employee.EmployeeType;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.employee.EmployeeService;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(value = EmployeeController.class,
        excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class EmployeeControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean EmployeeService employeeService;
    @MockBean ScopeHelper scopeHelper;

    private EmployeeResponse sampleEmployee() {
        return EmployeeResponse.builder()
                .id(1L)
                .templeId(100L)
                .fullName("Raman Iyer")
                .employeeType(EmployeeType.PRIEST)
                .designation("Head Priest")
                .status(EmployeeStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    class ListEmployees {

        @Test
        void should_return200WithEmployees_when_templeHasEmployees() throws Exception {
            var pageImpl = new PageImpl<>(List.of(sampleEmployee()), PageRequest.of(0, 10), 1L);
            when(employeeService.listByTemple(100L, 0, 10)).thenReturn(PaginatedResponse.of(pageImpl));

            mockMvc.perform(get("/api/v1/temples/100/employees"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.content[0].fullName").value("Raman Iyer"));
        }

        @Test
        void should_return200EmptyPage_when_noEmployees() throws Exception {
            var pageImpl = new PageImpl<>(List.<EmployeeResponse>of(), PageRequest.of(0, 10), 0L);
            when(employeeService.listByTemple(999L, 0, 10)).thenReturn(PaginatedResponse.of(pageImpl));

            mockMvc.perform(get("/api/v1/temples/999/employees"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(0));
        }
    }

    @Nested
    class CreateEmployee {

        @Test
        void should_return201_when_validRequest() throws Exception {
            String body = """
                {
                  "fullName": "Raman Iyer",
                  "employeeType": "PRIEST",
                  "designation": "Head Priest"
                }
                """;
            when(employeeService.create(eq(100L), any())).thenReturn(sampleEmployee());

            mockMvc.perform(post("/api/v1/temples/100/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.message").value("Employee created."))
                    .andExpect(jsonPath("$.data.id").value(1));
        }

        @Test
        void should_return400_when_fullNameBlank() throws Exception {
            mockMvc.perform(post("/api/v1/temples/100/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"fullName\":\"\",\"employeeType\":\"PRIEST\"}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void should_return400_when_employeeTypeMissing() throws Exception {
            mockMvc.perform(post("/api/v1/temples/100/employees")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"fullName\":\"Raman Iyer\"}"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    class GetEmployee {

        @Test
        void should_return200_when_employeeFound() throws Exception {
            when(employeeService.getById(1L)).thenReturn(sampleEmployee());

            mockMvc.perform(get("/api/v1/employees/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.fullName").value("Raman Iyer"));
        }
    }

    @Nested
    class UpdateEmployee {

        @Test
        void should_return200_when_validUpdate() throws Exception {
            String body = "{\"designation\":\"Senior Priest\"}";
            when(employeeService.update(eq(1L), any())).thenReturn(sampleEmployee());

            mockMvc.perform(put("/api/v1/employees/1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Employee updated."));
        }
    }

    @Nested
    class DeleteEmployee {

        @Test
        void should_return200_when_employeeDeleted() throws Exception {
            doNothing().when(employeeService).softDelete(1L);

            mockMvc.perform(delete("/api/v1/employees/1"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Employee removed."));
        }
    }
}
