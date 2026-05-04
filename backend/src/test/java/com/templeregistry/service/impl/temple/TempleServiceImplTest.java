package com.templeregistry.service.impl.temple;

import com.templeregistry.dto.request.temple.CreateTempleRequest;
import com.templeregistry.dto.request.temple.TempleSearchFilterRequest;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.temple.TempleMapper;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
class TempleServiceImplTest {

    @Mock TempleRepository templeRepository;
    @Mock TempleSearchSummaryRepository searchSummaryRepository;
    @Mock TempleSearchSummaryService searchSummaryService;
    @Mock TempleMapper templeMapper;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock PaginationUtil paginationUtil;
    @Mock com.templeregistry.service.notification.NotificationHelper notificationHelper;

    @InjectMocks TempleServiceImpl templeService;

    @Test
    void should_createTemple_and_triggerSearchSummaryRefresh() {
        CreateTempleRequest rq = CreateTempleRequest.builder()
                .name("Shiva Temple").districtId(10L).grade(TempleGrade.A).build();
        Temple saved = Temple.builder().name("Shiva Temple").districtId(10L).grade(TempleGrade.A).build();
        TempleResponse response = TempleResponse.builder().name("Shiva Temple").build();

        when(templeRepository.save(any())).thenReturn(saved);
        when(templeMapper.toTempleResponse(saved)).thenReturn(response);

        TempleResponse result = templeService.create(rq);

        assertThat(result.getName()).isEqualTo("Shiva Temple");
        verify(searchSummaryService).refresh(any());
    }

    @Test
    void should_throw_EntityNotFoundException_when_temple_not_found() {
        when(templeRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> templeService.getById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void should_enforceDistrictId_when_DC_calls_search() {
        TempleSearchFilterRequest filter = TempleSearchFilterRequest.builder().districtId(10L).build();
        when(jurisdictionGuard.enforceDistrictId(10L)).thenReturn(10L);
        when(paginationUtil.clampSize(10)).thenReturn(10);
        when(searchSummaryRepository.findAll(
                ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<com.templeregistry.entity.temple.TempleSearchSummary>>any(),
                any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(org.springframework.data.domain.Page.empty());

        templeService.search(filter);

        verify(jurisdictionGuard).enforceDistrictId(10L);
    }
}
