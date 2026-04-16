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
        UpdateTrustRequest request = new UpdateTrustRequest();
        request.setTrustName("Updated Trust");
        request.setTrustRegistrationNumber("TR002");
        request.setDateOfRegistration(LocalDate.now());
        request.setRegisteringAuthority("Authority");
        request.setTrustType(TrustType.PUBLIC);
        request.setBankNameAndBranch("SBI Main");
        request.setBankAccountNumber("123456789012");
        request.setAnnualIncome(new BigDecimal("10000.00"));

        mockMvc.perform(put("/api/v1/trusts/undefined")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Trust not registered."));
    }

    @Test
    void shouldReturn404WhenUpdatingNonExistentTrust() throws Exception {
        UpdateTrustRequest request = new UpdateTrustRequest();
        request.setTrustName("Updated Trust");
        request.setTrustRegistrationNumber("TR002");
        request.setDateOfRegistration(LocalDate.now());
        request.setRegisteringAuthority("Authority");
        request.setTrustType(TrustType.PUBLIC);
        request.setBankNameAndBranch("SBI Main");
        request.setBankAccountNumber("123456789012");
        request.setAnnualIncome(new BigDecimal("10000.00"));

        mockMvc.perform(put("/api/v1/trusts/999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Trust not registered."));
    }

    @Test
    void shouldCreateAndRetrieveTrust() throws Exception {
        CreateTrustRequest request = new CreateTrustRequest();
        request.setTrustName("Test Trust");
        request.setTrustRegistrationNumber("TR001");
        request.setDateOfRegistration(LocalDate.now());
        request.setRegisteringAuthority("Auth");
        request.setTrustType(TrustType.PRIVATE);
        request.setTrustPANNumber("ABCDE1234F");
        request.setBankNameAndBranch("HDFC City");
        request.setBankAccountNumber("98765432101");
        request.setAnnualIncome(new BigDecimal("50000.00"));

        // 1. POST: Create Trust
        mockMvc.perform(post("/api/v1/temples/" + templeId + "/trusts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.trustName").value("Test Trust"))
                .andExpect(jsonPath("$.data.trustRegistrationNumber").value("TR001"));

        // 2. GET: Retrieve Trusts
        mockMvc.perform(get("/api/v1/temples/" + templeId + "/trusts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].trustName").value("Test Trust"))
                .andExpect(jsonPath("$.data[0].trustRegistrationNumber").value("TR001"));
    }
}