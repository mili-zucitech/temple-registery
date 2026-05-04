package com.templeregistry.integration;

import com.templeregistry.dto.request.declaration.CreateDeclarationRequest;
import com.templeregistry.dto.response.declaration.CompleteDeclarationResponse;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.geo.City;
import com.templeregistry.entity.geo.District;
import com.templeregistry.entity.geo.Hobli;
import com.templeregistry.entity.geo.State;
import com.templeregistry.entity.geo.Taluk;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.ReligiousTradition;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.geo.CityRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.geo.HobliRepository;
import com.templeregistry.repository.geo.StateRepository;
import com.templeregistry.repository.geo.TalukRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.service.declaration.OverdueScheduler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration test: OverdueScheduler flags overdue declarations.
 *
 * Creates a declaration with dueDate in the past, sets status to SUBMITTED,
 * invokes flagOverdueDeclarations() directly, and asserts:
 * - isOverdue = true
 * - overdueFlaggedAt is non-null
 * - status is still SUBMITTED (unchanged)
 *
 * Testcontainers MySQL base resolves H2 incompatibility — see {@link MySQLContainerBase}.
 */
@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
class OverdueSchedulerIT extends MySQLContainerBase {

    @Autowired
    private DeclarationService declarationService;

    @Autowired
    private OverdueScheduler overdueScheduler;

    @Autowired
    private TempleRepository templeRepository;

    @Autowired
    private DeclarationRepository declarationRepository;

    @Autowired
    private AssetDeclarationVersionRepository versionRepository;

    @Autowired
    private GovernanceActionRepository governanceActionRepository;

    @Autowired
    private StateRepository stateRepository;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private DistrictRepository districtRepository;

    @Autowired
    private TalukRepository talukRepository;

    @Autowired
    private HobliRepository hobliRepository;

    private Long templeId;
    private ScopeHelper.Claims taClaims;

    @BeforeEach
    void setUp() {
        governanceActionRepository.deleteAll();
        versionRepository.deleteAll();
        declarationRepository.deleteAll();
        templeRepository.deleteAll();
        hobliRepository.deleteAll();
        talukRepository.deleteAll();
        districtRepository.deleteAll();
        cityRepository.deleteAll();
        stateRepository.deleteAll();

        // Set up bootstrap security context for JPA auditing
        ScopeHelper.Claims bootstrapClaims = new ScopeHelper.Claims(1L, "TEMPLE_AUTHORITY", null, null, "ta_user");
        setSecurityContext(bootstrapClaims);

        Hobli hobli = createGeoHierarchy();
        Temple temple = createTemple(hobli);
        templeId = temple.getId();

        taClaims = new ScopeHelper.Claims(1L, "TEMPLE_AUTHORITY", null, templeId, "ta_user");
        setSecurityContext(taClaims);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void flagOverdueDeclarations_setsIsOverdueTrueAndStatusUnchanged() {
        // Create a declaration with dueDate in the past
        CreateDeclarationRequest request = new CreateDeclarationRequest();
        request.setFinancialYear("2025-26");
        request.setDueDate(LocalDate.now().minusDays(10)); // past due date
        CompleteDeclarationResponse created = declarationService.create(templeId, request);
        Long declarationId = created.getId();

        // Submit the declaration so status = SUBMITTED (non-terminal)
        declarationService.submit(declarationId);

        AssetDeclaration afterSubmit = declarationRepository.findById(declarationId).orElseThrow();
        assertThat(afterSubmit.getStatus()).isEqualTo(DeclarationStatus.SUBMITTED);
        assertThat(afterSubmit.isOverdue()).isFalse();

        // Invoke the overdue scheduler directly
        overdueScheduler.flagOverdueDeclarations();

        // Re-fetch from DB
        AssetDeclaration afterScheduler = declarationRepository.findById(declarationId).orElseThrow();

        // Assert isOverdue = true
        assertThat(afterScheduler.isOverdue()).isTrue();

        // Assert overdueFlaggedAt is non-null
        assertThat(afterScheduler.getOverdueFlaggedAt()).isNotNull();

        // Assert status is still SUBMITTED (unchanged)
        assertThat(afterScheduler.getStatus()).isEqualTo(DeclarationStatus.SUBMITTED);
    }

    @Test
    void flagOverdueDeclarations_doesNotFlagApprovedDeclarations() {
        // Create a declaration with dueDate in the past
        CreateDeclarationRequest request = new CreateDeclarationRequest();
        request.setFinancialYear("2024-25");
        request.setDueDate(LocalDate.now().minusDays(5));
        CompleteDeclarationResponse created = declarationService.create(templeId, request);
        Long declarationId = created.getId();

        // Manually set status to APPROVED (bypassing workflow for test setup)
        AssetDeclaration declaration = declarationRepository.findById(declarationId).orElseThrow();
        declaration.setStatus(DeclarationStatus.APPROVED);
        declarationRepository.save(declaration);

        // Invoke the overdue scheduler
        overdueScheduler.flagOverdueDeclarations();

        // Re-fetch from DB
        AssetDeclaration afterScheduler = declarationRepository.findById(declarationId).orElseThrow();

        // Assert isOverdue is still false (APPROVED is terminal — should not be flagged)
        assertThat(afterScheduler.isOverdue()).isFalse();
        assertThat(afterScheduler.getStatus()).isEqualTo(DeclarationStatus.APPROVED);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Creates the full geo hierarchy: State → City → District → Taluk → Hobli.
     */
    private Hobli createGeoHierarchy() {
        State state = stateRepository.save(State.builder()
                .name("Test State")
                .code("TS")
                .build());

        City city = cityRepository.save(City.builder()
                .state(state)
                .name("Test City")
                .build());

        District district = districtRepository.save(District.builder()
                .city(city)
                .name("Test District")
                .code("TD")
                .build());

        Taluk taluk = talukRepository.save(Taluk.builder()
                .district(district)
                .name("Test Taluk")
                .build());

        return hobliRepository.save(Hobli.builder()
                .taluk(taluk)
                .name("Test Hobli")
                .build());
    }

    private Temple createTemple(Hobli hobli) {
        Temple temple = Temple.builder()
                .name("Overdue Temple")
                .registrationNumber("REG-OD-001")
                .grade(TempleGrade.C)
                .tradition(ReligiousTradition.OTHER)
                .doorNumber("5")
                .street("Late Street")
                .villageTown("Overdueville")
                .pinCode("560005")
                .districtId(hobli.getTaluk().getDistrict().getId())
                .hobliId(hobli.getId())
                .primaryDeity("Lakshmi")
                .build();
        return templeRepository.save(temple);
    }

    private void setSecurityContext(ScopeHelper.Claims claims) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, Collections.emptyList()));
    }
}
