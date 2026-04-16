package com.templeregistry.service.impl.temple;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TempleSearchSummaryServiceImpl implements TempleSearchSummaryService {

    private final TempleRepository templeRepository;
    private final TempleSearchSummaryRepository summaryRepository;

    @Override
    @Async
    @Transactional
    public void refresh(Long templeId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        summaryRepository.deleteByTempleId(templeId);
        summaryRepository.save(toSummary(temple));
        log.info("Search summary refreshed for temple [{}]", templeId);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void rebuildAll() {
        log.info("Starting full temple_search_summary rebuild...");
        summaryRepository.deleteAll();
        List<Temple> temples = templeRepository.findAll();
        List<TempleSearchSummary> summaries = temples.stream().map(this::toSummary).toList();
        summaryRepository.saveAll(summaries);
        log.info("Temple search summary rebuild complete. {} records written.", summaries.size());
    }

    private TempleSearchSummary toSummary(Temple t) {
        return TempleSearchSummary.builder()
                .templeId(t.getId())
                .name(t.getName())
                .registrationNumber(t.getRegistrationNumber())
                .grade(t.getGrade() != null ? t.getGrade().name() : null)
                .primaryDeity(t.getPrimaryDeity())
                .tradition(t.getTradition() != null ? t.getTradition().name() : null)
                .hobliId(t.getHobliId())
                .talukId(t.getTalukId())
                .districtId(t.getDistrictId())
                .cityId(0L)            // populated by DC module refresh() once geo chain is loaded
                .templeStatus("ACTIVE") // default; DC module refresh() will read temple.status when added
                .trustRegistered(t.isTrustRegistered())
                .assetDeclarationStatus(t.getAssetDeclarationStatus())
                .yearEstablished(t.getYearEstablished())
                // DC module counters — initialised to 0 here; DC refresh() will recompute from sub-queries
                .pendingDeclarations(0)
                .overdueDeclarations(0)
                .pendingProfileReview(0)
                .hasActiveTrust(false)
                .hasApprovedDeclaration(false)
                .lastDeclarationAt(null)
                .lastProfileUpdateAt(null)
                .build();
    }
}
