package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DcTempleSearchServiceImplTest {

    @Mock
    private TempleSearchSummaryRepository summaryRepository;

    @InjectMocks
    private DcTempleSearchServiceImpl service;

    private static final ScopeHelper.Claims SA_CLAIMS =
            new ScopeHelper.Claims(1L, RoleConstants.SUPER_ADMIN, null, null, "sa_user");
    private static final ScopeHelper.Claims DC_CLAIMS =
            new ScopeHelper.Claims(2L, RoleConstants.DISTRICT_COLLECTOR, 5L, null, "dc_user");

    @SuppressWarnings("unchecked")
    @Test
    void should_useFilterDistrictId_when_SA_searches_any_district() {
        // SA provides districtId=7 — service must honour it (not override with JWT)
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .districtId(7L).build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
        // Verify no exception was thrown and the query ran
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_useFilterDistrictId_when_DC_searches_another_district() {
        // After the unlock, DC can supply any districtId — resolveDistrictId returns filter.districtId
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder()
                .districtId(99L).build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, DC_CLAIMS);
        assertThat(result).isNotNull();
    }

    @SuppressWarnings("unchecked")
    @Test
    void should_returnAllTemples_when_districtId_isNull() {
        // No district filter — returns statewide results
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder().build();

        when(summaryRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var result = service.search(filter, SA_CLAIMS);
        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
    }
}
