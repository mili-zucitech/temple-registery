package com.templeregistry.service.impl.auditor;

import com.templeregistry.dto.response.auditor.AuditTrailEntry;
import com.templeregistry.dto.response.auditor.ComplianceAnomalyResponse;
import com.templeregistry.entity.audit.AuditDataEvent;
import com.templeregistry.entity.audit.GovernanceActionHistory;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.repository.audit.AuditDataEventRepository;
import com.templeregistry.repository.audit.GovernanceActionRepository;
import com.templeregistry.repository.geo.DistrictRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.auditor.AuditorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditorServiceImpl implements AuditorService {

    private final TempleSearchSummaryRepository summaryRepository;
    private final AuditDataEventRepository auditDataEventRepository;
    private final GovernanceActionRepository governanceActionRepository;
    private final DistrictRepository districtRepository;

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public List<ComplianceAnomalyResponse> getComplianceReport() {
        List<TempleSearchSummary> anomalous = summaryRepository.findAllWithAnomalies();

        // Batch-resolve district IDs to names — avoids N+1 queries.
        Set<Long> districtIds = anomalous.stream()
                .filter(t -> t.getDistrictId() != null)
                .map(TempleSearchSummary::getDistrictId)
                .collect(Collectors.toSet());

        Map<Long, String> districtNames = districtIds.isEmpty() ? Map.of()
                : districtRepository.findAllById(districtIds).stream()
                        .collect(Collectors.toMap(d -> d.getId(), d -> d.getName()));

        List<ComplianceAnomalyResponse> anomalies = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (TempleSearchSummary tss : anomalous) {
            String districtName = tss.getDistrictId() != null
                    ? districtNames.getOrDefault(tss.getDistrictId(), "Unknown District")
                    : null;

            if (tss.getOverdueDeclarations() != null && tss.getOverdueDeclarations() > 0) {
                anomalies.add(ComplianceAnomalyResponse.builder()
                        .templeId(tss.getTempleId())
                        .templeName(tss.getName())
                        .districtName(districtName)
                        .anomalyType("OVERDUE_DECLARATION")
                        .description("Temple has " + tss.getOverdueDeclarations() + " overdue declaration(s).")
                        .detectedAt(now)
                        .build());
            }
            if (Boolean.FALSE.equals(tss.getHasApprovedDeclaration())) {
                anomalies.add(ComplianceAnomalyResponse.builder()
                        .templeId(tss.getTempleId())
                        .templeName(tss.getName())
                        .districtName(districtName)
                        .anomalyType("NO_APPROVED_DECLARATION")
                        .description("Temple has no approved asset declaration.")
                        .detectedAt(now)
                        .build());
            }
            if (Boolean.FALSE.equals(tss.getTrustRegistered())) {
                anomalies.add(ComplianceAnomalyResponse.builder()
                        .templeId(tss.getTempleId())
                        .templeName(tss.getName())
                        .districtName(districtName)
                        .anomalyType("NO_TRUST_REGISTERED")
                        .description("Temple does not have a registered trust.")
                        .detectedAt(now)
                        .build());
            }
        }
        return anomalies;
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    @Transactional(readOnly = true)
    public List<AuditTrailEntry> getAuditTrail(String entityType, Long entityId, int page, int size) {
        String normalizedType = entityType.toUpperCase();
        List<AuditTrailEntry> entries = new ArrayList<>();

        governanceActionRepository
                .findByEntityTypeAndEntityIdOrderByTimestampDesc(normalizedType, entityId)
                .stream()
                .map(this::fromGovernance)
                .forEach(entries::add);

        auditDataEventRepository
                .findAllByEntityTypeAndEntityId(normalizedType, entityId, PageRequest.of(0, 500))
                .stream()
                .map(this::fromDataEvent)
                .forEach(entries::add);

        entries.sort(Comparator.comparing(AuditTrailEntry::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        int start = page * size;
        int end   = Math.min(start + size, entries.size());
        return start < entries.size() ? new ArrayList<>(entries.subList(start, end)) : List.of();
    }

    private AuditTrailEntry fromGovernance(GovernanceActionHistory g) {
        return AuditTrailEntry.builder()
                .source("GOVERNANCE_ACTION")
                .action(g.getAction())
                .entityType(g.getEntityType())
                .entityId(g.getEntityId())
                .actorUserId(g.getDcUserId())
                .actorRole(g.getActorRole())
                .detail(g.getComment())
                .timestamp(g.getTimestamp())
                .build();
    }

    private AuditTrailEntry fromDataEvent(AuditDataEvent e) {
        return AuditTrailEntry.builder()
                .source("DATA_EVENT")
                .action(e.getAction())
                .entityType(e.getEntityType())
                .entityId(e.getEntityId())
                .actorUserId(e.getActorId())
                .actorRole(e.getActorRole())
                .detail(e.getDetail())
                .timestamp(e.getOccurredAt())
                .build();
    }
}
