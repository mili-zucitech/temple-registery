package com.templeregistry.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.UpdateTrustRequest;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.ReligiousTradition;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.templeregistry.entity.trust.TrustType;
import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple testing
@ActiveProfiles("test")
public class TrustIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TempleRepository templeRepository;

    @Autowired
    private TrustRepository trustRepository;

    private Long templeId = 761L;

    @BeforeEach
    void setUp() {
        trustRepository.deleteAll();
        templeRepository.deleteAll();

        // Create a temple for testing
        Temple temple = Temple.builder()
                .name("Test Temple")
                .registrationNumber("REG-123")
                .grade(TempleGrade.A)
                .tradition(ReligiousTradition.OTHER)
                .doorNumber("123")
                .street("Main St")
                .villageTown("Testville")
                .pinCode("123456")
                .districtId(1L)
                .build();
        temple.setId(templeId);
        templeRepository.save(temple);

        // Mock SecurityContext with a Temple Authority claim
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, "TEMPLE_AUTHORITY", 1L, templeId, "testuser");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(claims, null, java.util.Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void shouldReturn404WhenUpdatingUndefinedTrust() throws Exception {
        UpdateTrustRequest request = UpdateTrustRequest.builder()
                .trustName("Updated Trust")
                .registrationNumber("TR002")
                .dateOfRegistration(LocalDate.now())
                .registeringAuthority("Authority")
                .trustType(TrustType.PUBLIC)
                .bankName("SBI")
                .bankBranch("Main")
                .bankAccountNumber("123456789012")
                .annualIncome(new BigDecimal("10000.00"))
                .build();

        mockMvc.perform(put("/api/v1/trusts/undefined")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Trust not registered."));
    }

    @Test
    void shouldReturn404ForNonExistentTrust() throws Exception {
        UpdateTrustRequest request = UpdateTrustRequest.builder()
                .trustName("Updated Trust")
                .registrationNumber("TR002")
                .dateOfRegistration(LocalDate.now())
                .registeringAuthority("Authority")
                .trustType(TrustType.PUBLIC)
                .bankName("SBI")
                .bankBranch("Main")
                .bankAccountNumber("123456789012")
                .annualIncome(new BigDecimal("10000.00"))
                .build();

        mockMvc.perform(put("/api/v1/trusts/999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Trust not registered."));
    }

    @Test
    void shouldCreateAndRetrieveTrust() throws Exception {
        CreateTrustRequest request = CreateTrustRequest.builder()
                .trustName("Test Trust")
                .registrationNumber("TR001")
                .dateOfRegistration(LocalDate.now())
                .registeringAuthority("Auth")
                .trustType(TrustType.PRIVATE)
                .panNumber("ABCDE1234F")
                .bankName("HDFC")
                .bankBranch("City")
                .bankAccountNumber("98765432101")
                .annualIncome(new BigDecimal("50000.00"))
                .build();

        // 1. POST: Create Trust
        mockMvc.perform(post("/api/v1/temples/" + templeId + "/trusts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.trustName").value("Test Trust"))
                .andExpect(jsonPath("$.data.registrationNumber").value("TR001"));

        // 2. GET: Retrieve Trusts
        mockMvc.perform(get("/api/v1/temples/" + templeId + "/trusts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].trustName").value("Test Trust"))
                .andExpect(jsonPath("$.data[0].registrationNumber").value("TR001"));
    }
}