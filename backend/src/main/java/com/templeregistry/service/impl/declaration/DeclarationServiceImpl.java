package com.templeregistry.service.impl.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.dc.ClarificationItemResponse;
import com.templeregistry.dto.response.declaration.*;
import com.templeregistry.entity.declaration.*;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.JurisdictionAccessDeniedException;
import com.templeregistry.repository.declaration.*;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.PaginationUtil;
import com.templeregistry.util.StatusTransitionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationServiceImpl implements DeclarationService {

    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final AssetDeclarationVersionRepository versionRepository;
    private final TempleRepository templeRepository;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final StatusTransitionValidator transitionValidator;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final NotificationEventPublisher notificationPublisher;
    private final PaginationUtil paginationUtil;
    private final AuditService auditService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<DeclarationResponse> listByTemple(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        Page<AssetDeclaration> result = declarationRepository.findAllByTempleId(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public PaginatedResponse<DeclarationResponse> listByDistrict(Long districtId, String status, String financialYear, int page, int size) {
        log.info("[DeclarationService] listByDistrict called with: districtId={}, status={}, financialYear={}, page={}, size={}",
                districtId, status, financialYear, page, size);
        
        var pageable = PageRequest.of(page, paginationUtil.clampSize(size));
        Page<AssetDeclaration> result;
        // districtId == null means SUPER_ADMIN with no district restriction — return
        // all.
        if (status != null && !status.isBlank()) {
            DeclarationStatus ds = DeclarationStatus.valueOf(status.toUpperCase());
            if (financialYear != null && !financialYear.isBlank()) {
                log.info("[DeclarationService] Filtering by financialYear={}", financialYear);
                result = districtId != null
                        ? declarationRepository.findAllByDistrictIdAndStatusAndFinancialYear(districtId, ds, financialYear, pageable)
                        : declarationRepository.findAllByStatusAndFinancialYear(ds, financialYear, pageable);
            } else {
                result = districtId != null
                        ? declarationRepository.findAllByDistrictIdAndStatus(districtId, ds, pageable)
                        : declarationRepository.findAllByStatus(ds, pageable);
            }
        } else {
            result = districtId != null
                    ? declarationRepository.findAllByDistrictId(districtId, pageable)
                    : declarationRepository.findAll(pageable);
        }
        
        log.info("[DeclarationService] Query returned {} results", result.getTotalElements());
        
        // Batch fetch temple names to avoid N+1 query problem
        Set<Long> templeIds = result.getContent().stream()
                .map(AssetDeclaration::getTempleId)
                .collect(Collectors.toSet());
        
        Map<Long, String> templeNames = templeRepository.findAllById(templeIds)
                .stream()
                .collect(Collectors.toMap(Temple::getId, Temple::getName));
        
        return PaginatedResponse.of(result.map(d -> toResponse(d, templeNames)));
    }

    @Transactional
    public DeclarationResponse create(Long templeId, CreateDeclarationRequest rq) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        AssetDeclaration d = buildFromRequest(rq, templeId, temple.getDistrictId());
        AssetDeclaration saved = declarationRepository.save(d);
        log.info("Declaration created: id=[{}] temple=[{}] status=DRAFT", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public DeclarationResponse getById(Long id) {
        AssetDeclaration d = findOrThrow(id);
        assertAccess(d);
        return toResponse(d);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public DeclarationResponse update(Long id, CreateDeclarationRequest rq) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        if (d.getStatus() != DeclarationStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT declarations can be updated.");
        }
        applyFields(d, rq);
        return toResponse(declarationRepository.save(d));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void submit(Long id) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(),
                DeclarationStatus.PENDING_REVIEW.name());
        d.setStatus(DeclarationStatus.PENDING_REVIEW);
        d.setSubmittedAt(LocalDateTime.now());

        try {
            String json = objectMapper.writeValueAsString(toResponse(d));
            d.setSnapshotJson(json);
            declarationRepository.save(d);

            versionRepository.save(AssetDeclarationVersion.builder()
                    .declarationId(d.getId())
                    .versionNumber(d.getVersionNumber())
                    .snapshotJson(json)
                    .createdByUserId(currentUserId())
                    .build());
        } catch (Exception e) {
            log.error("Failed to write snapshot JSON for declaration [{}]", id, e);
            throw new RuntimeException("Failed to create snapshot", e);
        }

        log.info("Declaration [{}] submitted.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void approve(Long id) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(), DeclarationStatus.APPROVED.name());
        d.setStatus(DeclarationStatus.APPROVED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(currentUserId());
        d.setAcknowledgementNumber(ackGenerator.generate());
        declarationRepository.save(d);
        log.info("Declaration [{}] approved. Ack=[{}]", id, d.getAcknowledgementNumber());
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void reject(Long id, ClarificationRequest reason) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(), DeclarationStatus.REJECTED.name());
        d.setStatus(DeclarationStatus.REJECTED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(currentUserId());
        declarationRepository.save(d);
        saveClarification(id, reason.getMessage(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Declaration [{}] rejected.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void requestClarification(Long id, ClarificationRequest request) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.CLARIFICATION_REQUESTED.name());
        d.setStatus(DeclarationStatus.CLARIFICATION_REQUESTED);
        declarationRepository.save(d);
        saveClarification(id, request.getMessage(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Clarification requested for declaration [{}].", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void flagPhysicalVerification(Long id, FlagPhysicalVerificationRequest request) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name());
        d.setStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED);
        declarationRepository.save(d);
        saveClarification(id, request.getNotes(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Physical verification flagged for declaration [{}].", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void resubmit(Long id, ResubmitDeclarationRequest rq) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.RESUBMITTED.name());
        applyResubmitFields(d, rq);
        d.setStatus(DeclarationStatus.RESUBMITTED);
        d.setSubmittedAt(LocalDateTime.now());
        d.setVersionNumber(d.getVersionNumber() + 1);

        try {
            String json = objectMapper.writeValueAsString(toResponse(d));
            d.setSnapshotJson(json);
            declarationRepository.save(d);

            versionRepository.save(AssetDeclarationVersion.builder()
                    .declarationId(d.getId())
                    .versionNumber(d.getVersionNumber())
                    .snapshotJson(json)
                    .createdByUserId(currentUserId())
                    .build());
        } catch (Exception e) {
            log.error("Failed to write snapshot JSON for resubmitted declaration [{}]", id, e);
            throw new RuntimeException("Failed to create snapshot", e);
        }

        saveClarification(id, rq.getCorrectionNotes(), ClarificationDirection.TEMPLE_TO_DC);
        log.info("Declaration [{}] resubmitted. New version: {}", id, d.getVersionNumber());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public AcknowledgementResponse getAcknowledgement(Long id) {
        AssetDeclaration d = findOrThrow(id);
        assertAccess(d);
        if (d.getStatus() != DeclarationStatus.APPROVED) {
            throw new IllegalStateException("Acknowledgement is only available for APPROVED declarations.");
        }
        // TODO: Generate pre-signed S3 URL for the PDF acknowledgement
        return AcknowledgementResponse.builder()
                .acknowledgementNumber(d.getAcknowledgementNumber())
                .downloadUrl("presigned-url-placeholder")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<DeclarationDiffResponse> getDiff(Long id) {
        AssetDeclaration d = findOrThrow(id);
        assertAccess(d);
        if (d.getSnapshotJson() == null || d.getSnapshotJson().isBlank()) {
            return List.of(); // no snapshot yet — first submission or pre-submission
        }
        // Compare key numeric fields between snapshot values and current entity values.
        // snapshotJson is a JSON object; parse and compare selected fields.
        List<DeclarationDiffResponse> diffs = new ArrayList<>();
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<?, ?> snapshot = mapper.readValue(d.getSnapshotJson(), java.util.Map.class);
            compareField(diffs, "agriculturalLandAcres", snapshot, d.getAgriculturalLandAcres());
            compareField(diffs, "agriculturalLandValue", snapshot, d.getAgriculturalLandValue());
            compareField(diffs, "buildingsSqft", snapshot, d.getBuildingsSqft());
            compareField(diffs, "buildingsValue", snapshot, d.getBuildingsValue());
            compareField(diffs, "goldGrams", snapshot, d.getGoldGrams());
            compareField(diffs, "silverGrams", snapshot, d.getSilverGrams());
            compareField(diffs, "financialAssetsValue", snapshot, d.getFinancialAssetsValue());
            compareField(diffs, "otherMovableValue", snapshot, d.getOtherMovableValue());
        } catch (Exception e) {
            log.warn("Failed to parse snapshot JSON for declaration [{}]: {}", id, e.getMessage());
        }
        return diffs;
    }

    @Override
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Transactional
    public void forceDraft(Long id) {
        AssetDeclaration d = findOrThrow(id);
        if (d.getStatus() != DeclarationStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                    "Only PENDING_REVIEW declarations can be force-reverted to DRAFT. Current status: "
                            + d.getStatus());
        }
        d.setStatus(DeclarationStatus.DRAFT);
        declarationRepository.save(d);
        auditService.logDataEvent(currentUserId(), "SUPER_ADMIN", "UPDATE", "AssetDeclaration", id,
                "Force-reverted declaration to DRAFT by SA");
        log.info("Declaration [{}] force-reverted to DRAFT by SA [{}]", id, currentUserId());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PaginatedResponse<DeclarationResponse> getPhysicalVerificationPending(int page, int size) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        Page<AssetDeclaration> result = declarationRepository.findPhysicalVerificationPendingOlderThan(
                threshold, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<ClarificationItemResponse> listClarifications(Long declarationId) {
        AssetDeclaration d = findOrThrow(declarationId);
        assertAccess(d);
        return clarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(declarationId)
                .stream()
                .map(c -> ClarificationItemResponse.builder()
                        .id(c.getId())
                        .direction(c.getDirection().name())
                        .message(c.getMessage())
                        .sectionName(c.getSectionName())
                        .fieldNamesJson(c.getFieldNamesJson())
                        .authorId(c.getAuthorId())
                        .createdAt(c.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Scheduled(cron = "0 0 6 * * *") // daily at 6 AM
    @Transactional
    public void flagOverdue() {
        LocalDate today = LocalDate.now();
        List<AssetDeclaration> overdue = declarationRepository.findDeclarationsToFlagAsOverdue(today);

        log.info("Found {} declarations to mark as OVERDUE", overdue.size());

        for (AssetDeclaration d : overdue) {
            String oldStatus = d.getStatus().name();
            d.setStatus(DeclarationStatus.OVERDUE);
            d.setOverdue(true);
            d.setOverdueFlaggedAt(LocalDateTime.now());
            declarationRepository.save(d);

            notificationPublisher.publish(
                    d.getSubmittedBy(), "DECLARATION_OVERDUE", d.getId(), "ASSET_DECLARATION");

            auditService.logDataEvent(0L, "SYSTEM", "STATUS_CHANGE", "AssetDeclaration", d.getId(),
                    "status=" + oldStatus + " -> OVERDUE (automatic batch)");
        }
    }

    private AssetDeclaration findOrThrow(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", id));
    }

    private void assertAccess(AssetDeclaration d) {
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c)
            return c.userId();
        return 0L;
    }

    private void saveClarification(Long declarationId, String message, ClarificationDirection direction) {
        clarificationRepository.save(DeclarationClarification.builder()
                .declarationId(declarationId)
                .direction(direction)
                .message(message)
                .authorId(currentUserId())
                .build());
    }

    private AssetDeclaration buildFromRequest(CreateDeclarationRequest rq, Long templeId, Long districtId) {
        return AssetDeclaration.builder()
                .templeId(templeId).districtId(districtId).status(DeclarationStatus.DRAFT)
                .agriculturalLandAcres(rq.getAgriculturalLandAcres())
                .agriculturalLandValue(rq.getAgriculturalLandValue())
                .buildingsSqft(rq.getBuildingsSqft()).buildingsValue(rq.getBuildingsValue())
                .leasedPropertiesCount(rq.getLeasedPropertiesCount())
                .leasedPropertiesValue(rq.getLeasedPropertiesValue())
                .otherLandValue(rq.getOtherLandValue()).goldGrams(rq.getGoldGrams()).silverGrams(rq.getSilverGrams())
                .idolsCount(rq.getIdolsCount()).vehiclesCount(rq.getVehiclesCount())
                .financialAssetsValue(rq.getFinancialAssetsValue()).otherMovableValue(rq.getOtherMovableValue())
                .dueDate(rq.getDueDate()).build();
    }

    private void applyFields(AssetDeclaration d, CreateDeclarationRequest rq) {
        d.setAgriculturalLandAcres(rq.getAgriculturalLandAcres());
        d.setAgriculturalLandValue(rq.getAgriculturalLandValue());
        d.setBuildingsSqft(rq.getBuildingsSqft());
        d.setBuildingsValue(rq.getBuildingsValue());
        d.setGoldGrams(rq.getGoldGrams());
        d.setSilverGrams(rq.getSilverGrams());
        d.setFinancialAssetsValue(rq.getFinancialAssetsValue());
        d.setOtherMovableValue(rq.getOtherMovableValue());
        d.setDueDate(rq.getDueDate());
    }

    private void applyResubmitFields(AssetDeclaration d, ResubmitDeclarationRequest rq) {
        if (rq.getAgriculturalLandAcres() != null)
            d.setAgriculturalLandAcres(rq.getAgriculturalLandAcres());
        if (rq.getGoldGrams() != null)
            d.setGoldGrams(rq.getGoldGrams());
        if (rq.getSilverGrams() != null)
            d.setSilverGrams(rq.getSilverGrams());
        if (rq.getFinancialAssetsValue() != null)
            d.setFinancialAssetsValue(rq.getFinancialAssetsValue());
    }

    private DeclarationResponse toResponse(AssetDeclaration d) {
        return toResponse(d, null);
    }

    private DeclarationResponse toResponse(AssetDeclaration d, Map<Long, String> templeNames) {
        String templeName = (templeNames != null)
                ? templeNames.getOrDefault(d.getTempleId(), null)
                : templeRepository.findById(d.getTempleId())
                        .map(Temple::getName)
                        .orElse(null);
        
        return DeclarationResponse.builder()
                .id(d.getId()).templeId(d.getTempleId()).templeName(templeName)
                .districtId(d.getDistrictId()).financialYear(d.getFinancialYear())
                .status(d.getStatus()).agriculturalLandAcres(d.getAgriculturalLandAcres())
                .agriculturalLandValue(d.getAgriculturalLandValue()).buildingsSqft(d.getBuildingsSqft())
                .buildingsValue(d.getBuildingsValue()).goldGrams(d.getGoldGrams()).silverGrams(d.getSilverGrams())
                .idolsCount(d.getIdolsCount()).vehiclesCount(d.getVehiclesCount())
                .financialAssetsValue(d.getFinancialAssetsValue()).otherMovableValue(d.getOtherMovableValue())
                .submittedAt(d.getSubmittedAt()).reviewedAt(d.getReviewedAt())
                .acknowledgementNumber(d.getAcknowledgementNumber()).dueDate(d.getDueDate()).build();
    }

    private void compareField(List<DeclarationDiffResponse> diffs, String field,
            java.util.Map<?, ?> snapshot, Object currentValue) {
        Object snapshotValue = snapshot.get(field);
        String snv = snapshotValue != null ? snapshotValue.toString() : null;
        String curv = currentValue != null ? currentValue.toString() : null;
        if (!java.util.Objects.equals(snv, curv)) {
            diffs.add(DeclarationDiffResponse.builder().field(field).oldValue(snv).newValue(curv).build());
        }
    }
}
