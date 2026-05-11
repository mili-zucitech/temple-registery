package com.templeregistry.service.impl.temple;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TempleSearchSummaryServiceImpl implements TempleSearchSummaryService {

    private final TempleRepository templeRepository;
    private final TempleSearchSummaryRepository summaryRepository;
    private final TempleProfileStagingRepository stagingRepository;
    private final TrustRepository trustRepository;
    private final DeclarationRepository declarationRepository;
    private final ApplicationContext applicationContext;

    @Override
    @Async
    @Transactional
    public void refresh(Long templeId) {
        Temple temple = templeRepository.findWithFullGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        summaryRepository.deleteByTempleId(templeId);
        TempleSearchSummary summary = toSummary(temple);
        log.debug("Search summary refresh: templeId={} resolved districtId={} talukId={} hobliId={}",
                templeId, summary.getDistrictId(), summary.getTalukId(), summary.getHobliId());
        summaryRepository.save(summary);
        log.info("Search summary refreshed for temple [{}]", templeId);
    }

    @Override
    public void scheduleRefresh(Long templeId) {
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    // Use applicationContext.getBean() to get the Spring proxy so
                    // @Async + @Transactional on refresh() are applied correctly.
                    // This avoids the circular-dependency problem of @Lazy self-injection
                    // and guarantees we get the fully-initialized proxied bean.
                    applicationContext.getBean(TempleSearchSummaryService.class).refresh(templeId);
                }
            });
        } else {
            applicationContext.getBean(TempleSearchSummaryService.class).refresh(templeId);
        }
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void rebuildAll() {
        log.info("Starting full temple_search_summary rebuild...");
        summaryRepository.deleteAllInBatch();
        List<Temple> temples = templeRepository.findAllWithFullGeo();
        List<TempleSearchSummary> summaries = temples.stream().map(this::toSummary).toList();
        summaryRepository.saveAll(summaries);
        log.info("Temple search summary rebuild complete. {} records written.", summaries.size());
    }

    private TempleSearchSummary toSummary(Temple t) {
        // Traverse the canonical hobli → taluk → district → city chain to derive geo IDs.
        // Do NOT read Temple.talukId / Temple.districtId flat scalars — they may be unset
        // (e.g. during staging→approval) and would cause district filtering to return wrong results.
        com.templeregistry.entity.geo.Hobli hobli = t.getHobli();
        if (hobli == null) {
            log.warn("Temple [{}] has no hobli association — broken geo chain; geo IDs will be null in search summary", t.getId());
        }
        com.templeregistry.entity.geo.Taluk taluk = hobli != null ? hobli.getTaluk() : null;
        com.templeregistry.entity.geo.District district = taluk != null ? taluk.getDistrict() : null;
        com.templeregistry.entity.geo.City city = district != null ? district.getCity() : null;

        return TempleSearchSummary.builder()
                .templeId(t.getId())
                .name(t.getName())
                .registrationNumber(t.getRegistrationNumber())
                .grade(t.getGrade() != null ? t.getGrade().name() : null)
                .primaryDeity(t.getPrimaryDeity())
                .tradition(t.getTradition() != null ? t.getTradition().name() : null)
                .hobliId(hobli != null ? hobli.getId() : null)
                .talukId(taluk != null ? taluk.getId() : null)
                .districtId(district != null ? district.getId() : null)
                .cityId(city != null ? city.getId() : null)
                .templeStatus(t.getStatus() != null ? t.getStatus().name() : TempleStatus.ACTIVE.name())
                .trustRegistered(t.isTrustRegistered())
                .assetDeclarationStatus(t.getAssetDeclarationStatus())
                .yearEstablished(t.getYearEstablished())
                .photoUrl(t.getPhotoUrl())
                // DC module counters — computed live on each summary refresh
                .pendingDeclarations((int) declarationRepository.countByTempleIdAndStatusIn(
                        t.getId(),
                        java.util.List.of(
                                DeclarationStatus.SUBMITTED,
                                DeclarationStatus.UNDER_REVIEW,
                                DeclarationStatus.CLARIFICATION_REQUIRED,
                                DeclarationStatus.CLARIFICATION_RESPONDED,
                                DeclarationStatus.SITE_VISIT_SCHEDULED,
                                DeclarationStatus.SITE_VISIT_COMPLETED,
                                DeclarationStatus.VERIFIED
                        )))
                .overdueDeclarations((int) declarationRepository.countByTempleIdAndStatus(
                        t.getId(), DeclarationStatus.OVERDUE))
                .pendingProfileReview(
                        stagingRepository.existsByTempleIdAndStatusIn(
                                t.getId(),
                                java.util.List.of(
                                        WorkflowStatus.SUBMITTED,
                                        WorkflowStatus.UNDER_REVIEW,
                                        WorkflowStatus.RESUBMITTED)) ? 1 : 0)
                .hasActiveTrust(trustRepository.existsByTempleIdAndStatusAndDeletedFalse(
                        t.getId(), TrustStatus.ACTIVE))
                .hasApprovedDeclaration(declarationRepository.existsByTempleIdAndStatus(
                        t.getId(), DeclarationStatus.APPROVED))
                .lastDeclarationAt(null)
                .lastProfileUpdateAt(null)
                .build();
    }
}
