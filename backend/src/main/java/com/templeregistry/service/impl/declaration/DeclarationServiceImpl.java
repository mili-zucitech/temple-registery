package com.templeregistry.service.impl.declaration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.ArtifactItemRequest;
import com.templeregistry.dto.request.declaration.ClarificationRequest;
import com.templeregistry.dto.request.declaration.CreateDeclarationRequest;
import com.templeregistry.dto.request.declaration.EquipmentItemRequest;
import com.templeregistry.dto.request.declaration.FinancialAssetItemRequest;
import com.templeregistry.dto.request.declaration.FlagPhysicalVerificationRequest;
import com.templeregistry.dto.request.declaration.PreciousMetalItemRequest;
import com.templeregistry.dto.request.declaration.ResubmitDeclarationRequest;
import com.templeregistry.dto.response.dc.ClarificationItemResponse;
import com.templeregistry.dto.response.declaration.AcknowledgementResponse;
import com.templeregistry.dto.response.declaration.CompleteDeclarationResponse;
import com.templeregistry.dto.response.declaration.DeclarationDiffResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.dto.response.declaration.DeclarationVersionResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.dc.DeclImmovAgriLand;
import com.templeregistry.entity.dc.DeclImmovBuilding;
import com.templeregistry.entity.dc.DeclImmovLeased;
import com.templeregistry.entity.dc.DeclImmovOther;
import com.templeregistry.entity.dc.DeclMovArtifact;
import com.templeregistry.entity.dc.DeclMovEquipment;
import com.templeregistry.entity.dc.DeclMovFinancial;
import com.templeregistry.entity.dc.DeclMovPreciousMetal;
import com.templeregistry.entity.dc.DeclMovVehicle;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.AssetDeclarationVersion;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.declaration.DeclarationStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.DeclarationAlreadyExistsException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.dc.DeclImmovAgriLandRepository;
import com.templeregistry.repository.dc.DeclImmovBuildingRepository;
import com.templeregistry.repository.dc.DeclImmovLeasedRepository;
import com.templeregistry.repository.dc.DeclImmovOtherRepository;
import com.templeregistry.repository.dc.DeclMovArtifactRepository;
import com.templeregistry.repository.dc.DeclMovEquipmentRepository;
import com.templeregistry.repository.dc.DeclMovFinancialRepository;
import com.templeregistry.repository.dc.DeclMovPreciousMetalRepository;
import com.templeregistry.repository.dc.DeclMovVehicleRepository;
import com.templeregistry.repository.declaration.AssetDeclarationVersionRepository;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.governance.GovernanceEditGuard;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.PaginationUtil;
import com.templeregistry.service.declaration.SnapshotService;
import com.templeregistry.service.audit.DeclarationAuditLogService;
import com.templeregistry.service.audit.AuditActionType;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.service.workflow.WorkflowActionRequest;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.service.workflow.WorkflowEngineAdaptor;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationServiceImpl implements DeclarationService {

    private static final Map<String, String> LEGACY_ALIASES = Map.of(
        "CLARIFICATION_REQUESTED", "CLARIFICATION_REQUIRED"
    );

    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final AssetDeclarationVersionRepository versionRepository;
    private final TempleRepository templeRepository;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final NotificationEventPublisher notificationPublisher;
    private final PaginationUtil paginationUtil;
    private final AuditService auditService;
    private final GovernanceAuditService governanceAuditService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;
    private final DeclImmovAgriLandRepository agriLandRepository;
    private final DeclImmovBuildingRepository buildingRepository;
    private final DeclImmovLeasedRepository leasedRepository;
    private final DeclImmovOtherRepository otherLandRepository;
    private final DeclMovPreciousMetalRepository preciousMetalRepository;
    private final DeclMovArtifactRepository artifactRepository;
    private final DeclMovVehicleRepository vehicleRepository;
    private final DeclMovEquipmentRepository equipmentRepository;
    private final DeclMovFinancialRepository financialRepository;
    private final com.templeregistry.mapper.declaration.DeclarationAssetMapper assetMapper;
    private final GovernanceEditGuard governanceEditGuard;
    private final SnapshotService snapshotService;
    private final DeclarationAuditLogService declarationAuditLogService;
    private final com.templeregistry.service.notification.NotificationHelper notificationHelper;
    private final WorkflowEngineAdaptor workflowEngineAdaptor;
    private final WorkflowEngine workflowEngine;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<DeclarationResponse> listByTemple(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        PageRequest pageable = PageRequest.of(
                page,
                paginationUtil.clampSize(size),
                Sort.by(Sort.Order.desc("financialYear"), Sort.Order.desc("versionNumber"), Sort.Order.desc("id")));
        return PaginatedResponse.of(declarationRepository.findAllByTempleId(templeId, pageable).map(this::toSummaryResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public PaginatedResponse<DeclarationResponse> listByDistrict(Long districtId, String status, String financialYear, int page, int size) {
        PageRequest pageable = PageRequest.of(
                page,
                paginationUtil.clampSize(size),
                Sort.by(Sort.Order.desc("submittedAt"), Sort.Order.desc("versionNumber"), Sort.Order.desc("id")));

        Page<AssetDeclaration> result;
        if (status != null && !status.isBlank()) {
            DeclarationStatus declarationStatus = resolveStatus(status);
            if (financialYear != null && !financialYear.isBlank()) {
                result = districtId != null
                        ? declarationRepository.findAllByDistrictIdAndStatusAndFinancialYear(districtId, declarationStatus, financialYear, pageable)
                        : declarationRepository.findAllByStatusAndFinancialYear(declarationStatus, financialYear, pageable);
            } else {
                result = districtId != null
                        ? declarationRepository.findAllByDistrictIdAndStatus(districtId, declarationStatus, pageable)
                        : declarationRepository.findAllByStatus(declarationStatus, pageable);
            }
        } else {
            result = districtId != null
                    ? declarationRepository.findAllByDistrictIdExcludingDraft(districtId, pageable)
                    : declarationRepository.findAllExcludingDraft(pageable);
        }

        Set<Long> templeIds = result.getContent().stream().map(AssetDeclaration::getTempleId).collect(Collectors.toSet());
        Map<Long, String> templeNames = templeRepository.findAllById(templeIds).stream()
                .collect(Collectors.toMap(Temple::getId, Temple::getName));
        return PaginatedResponse.of(result.map(declaration -> toSummaryResponse(declaration, templeNames)));
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public CompleteDeclarationResponse create(Long templeId, CreateDeclarationRequest request) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = findTempleOrThrow(templeId);

        Optional<AssetDeclaration> existingDeclaration = declarationRepository
                .findTopByTempleIdAndFinancialYearOrderByVersionNumberDesc(templeId, request.getFinancialYear());

        if (existingDeclaration.isPresent()) {
            AssetDeclaration existing = existingDeclaration.get();
            if (Set.of(
                    DeclarationStatus.DRAFT,
                    DeclarationStatus.SUBMITTED,
                    DeclarationStatus.UNDER_REVIEW,
                    DeclarationStatus.CLARIFICATION_REQUIRED,
                    DeclarationStatus.SITE_VISIT_SCHEDULED,
                    DeclarationStatus.APPROVED
            ).contains(existing.getStatus())) {
                throw new DeclarationAlreadyExistsException(request.getFinancialYear(), existing.getId());
            }
        }

        int nextVersion = existingDeclaration
                .map(existing -> existing.getVersionNumber() + 1)
                .orElse(1);

        AssetDeclaration declaration = AssetDeclaration.builder()
                .templeId(templeId)
                .districtId(temple.getDistrictId())
                .financialYear(request.getFinancialYear())
                .versionNumber(nextVersion)
                .status(DeclarationStatus.DRAFT)
                .dueDate(request.getDueDate())
                .annualIncome(request.getAnnualIncome())
                .annualExpenditure(request.getAnnualExpenditure())
                .build();

        AssetDeclaration saved = declarationRepository.save(declaration);
        replaceAssetItems(saved.getId(), request);
        applySummaryFields(saved, request);
        saved = declarationRepository.save(saved);

        // ── Workflow Engine: initiate governance instance on creation ──────────
        workflowEngineAdaptor.ensureInitiated(
            WorkflowEntityType.DECLARATION, saved.getId(),
            templeId, temple.getDistrictId(), currentUserId());

        auditService.logDataEvent(currentUserId(), currentRole(), "CREATE", "AssetDeclaration", saved.getId(),
                "Created asset declaration draft");
        governanceAuditService.logAction(saved.getId(), "DECLARATION", currentUserId(), "CREATE_DRAFT",
                "Created declaration draft for FY " + saved.getFinancialYear());
        return buildCompleteResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public CompleteDeclarationResponse getById(Long id) {
        AssetDeclaration declaration = findOrThrow(id);
        assertAccess(declaration);
        return buildCompleteResponse(declaration);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public CompleteDeclarationResponse update(Long id, CreateDeclarationRequest request) {
        AssetDeclaration declaration = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(declaration.getTempleId());
        
        // Allow updates for DRAFT and REJECTED declarations
        if (declaration.getStatus() != DeclarationStatus.DRAFT && 
            declaration.getStatus() != DeclarationStatus.REJECTED) {
            throw new com.templeregistry.exception.DeclarationImmutableException(id);
        }

        declaration.setFinancialYear(request.getFinancialYear());
        declaration.setDueDate(request.getDueDate());
        declaration.setAnnualIncome(request.getAnnualIncome());
        declaration.setAnnualExpenditure(request.getAnnualExpenditure());
        replaceAssetItems(declaration.getId(), request);
        applySummaryFields(declaration, request);
        AssetDeclaration saved = declarationRepository.save(declaration);

        String action = declaration.getStatus() == DeclarationStatus.REJECTED ? "UPDATE_REJECTED" : "UPDATE_DRAFT";
        String message = declaration.getStatus() == DeclarationStatus.REJECTED ? 
                "Updated rejected declaration" : "Updated declaration draft";
        
        auditService.logDataEvent(currentUserId(), currentRole(), "UPDATE", "AssetDeclaration", saved.getId(), message);
        governanceAuditService.logAction(saved.getId(), "DECLARATION", currentUserId(), action, message);
        return buildCompleteResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public void submit(Long id) {
        // Canonical path: GovernanceWorkflowServiceImpl.submitDeclaration() is the single source of truth.
        // This method is kept for interface compatibility but throws to prevent dual-path mutation.
        throw new UnsupportedOperationException(
            "Use POST /api/v1/governance/declarations/{id}/submit. " +
            "DeclarationServiceImpl.submit() is removed to prevent dual-path workflow mutation.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public void respondToClarification(Long id, com.templeregistry.dto.request.declaration.ClarificationRespondRequest request, Long actorId, String actorRole) {
        AssetDeclaration declaration = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(declaration.getTempleId());

        clarificationRepository.save(DeclarationClarification.builder()
                .declarationId(id)
                .direction(ClarificationDirection.TEMPLE_TO_DC)
                .message(request.getMessage())
                .authorId(actorId)
                .build());

        Long workflowInstanceId = workflowEngineAdaptor.findState(WorkflowEntityType.DECLARATION, id)
            .map(wi -> wi.getId())
            .orElseThrow(() -> new EntityNotFoundException("WorkflowInstance for DECLARATION", id));

        workflowEngine.execute(
            workflowInstanceId,
            WorkflowActionRequest.builder()
                .action(WorkflowAction.RESPOND_CLARIFICATION)
                .comment(request.getMessage())
                .idempotencyKey(UUID.randomUUID().toString())
                .build(),
            ActionContext.builder()
                .actorId(actorId)
                .actorRole("TA")
                .ownedTempleIds(Set.of(declaration.getTempleId()))
                .build());

        declaration.setStatus(DeclarationStatus.CLARIFICATION_RESPONDED);
        declarationRepository.save(declaration);

        snapshotService.capture(declaration, actorId);
        declarationAuditLogService.log(id, AuditActionType.CLARIFICATION_RESPONDED, actorId, actorRole, null);

        auditService.logDataEvent(actorId, actorRole, "CLARIFICATION_RESPONDED", "AssetDeclaration", id,
                "Temple responded to clarification round " + declaration.getClarificationRound());
        governanceAuditService.logAction(id, "DECLARATION", actorId, "CLARIFICATION_RESPONDED",
                "Temple responded to clarification: " + request.getMessage());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public void approve(Long id) {
        throw new UnsupportedOperationException(
            "Use POST /api/v1/governance/declarations/{id}/approve instead.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public void reject(Long id, ClarificationRequest reason) {
        throw new UnsupportedOperationException(
            "Use POST /api/v1/governance/declarations/{id}/reject instead.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public void requestClarification(Long id, ClarificationRequest request) {
        throw new UnsupportedOperationException(
            "Use POST /api/v1/governance/declarations/{id}/clarify instead.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public void flagPhysicalVerification(Long id, FlagPhysicalVerificationRequest request) {
        throw new UnsupportedOperationException(
            "Use POST /api/v1/governance/declarations/{id}/flag-physical instead.");
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public CompleteDeclarationResponse resubmit(Long id, ResubmitDeclarationRequest request) {
        AssetDeclaration source = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(source.getTempleId());

        if (!Set.of(
                DeclarationStatus.CLARIFICATION_REQUIRED,
                DeclarationStatus.REJECTED,
                DeclarationStatus.SITE_VISIT_SCHEDULED).contains(source.getStatus())) {
            throw new IllegalStateException("Only rejected or clarification-requested declarations can be resubmitted.");
        }

        if (source.getStatus() != DeclarationStatus.REJECTED) {
            source.setStatus(DeclarationStatus.SUPERSEDED);
            declarationRepository.save(source);
        }

        int nextVersion = declarationRepository.findTopByTempleIdAndFinancialYearOrderByVersionNumberDesc(
                        source.getTempleId(), request.getFinancialYear())
                .map(existing -> existing.getVersionNumber() + 1)
                .orElse(source.getVersionNumber() + 1);

        AssetDeclaration resubmitted = AssetDeclaration.builder()
                .templeId(source.getTempleId())
                .districtId(source.getDistrictId())
                .financialYear(request.getFinancialYear())
                .versionNumber(nextVersion)
                .status(DeclarationStatus.SUBMITTED)
                .dueDate(request.getDueDate())
                .annualIncome(request.getAnnualIncome())
                .annualExpenditure(request.getAnnualExpenditure())
                .submittedAt(LocalDateTime.now())
                .submittedBy(currentUserId())
                .build();

        AssetDeclaration saved = declarationRepository.save(resubmitted);
        replaceAssetItems(saved.getId(), request);
        applySummaryFields(saved, request);
        CompleteDeclarationResponse snapshot = buildCompleteResponse(saved);
        String snapshotJson = serialize(snapshot);
        saved.setSnapshotJson(snapshotJson);
        declarationRepository.save(saved);

        versionRepository.save(AssetDeclarationVersion.builder()
                .declarationId(saved.getId())
                .versionNumber(saved.getVersionNumber())
                .snapshotJson(snapshotJson)
                .createdByUserId(currentUserId())
                .build());

        clarificationRepository.save(DeclarationClarification.builder()
                .declarationId(saved.getId())
                .direction(ClarificationDirection.TEMPLE_TO_DC)
                .message(request.getClarificationResponse())
                .authorId(currentUserId())
                .build());

        // ── Workflow Engine: initiate governance instance for the new resubmitted version ──
        workflowEngineAdaptor.ensureInitiated(
            WorkflowEntityType.DECLARATION, saved.getId(),
            saved.getTempleId(), saved.getDistrictId(), currentUserId());

        notifyDistrictReviewers(saved, "DECLARATION_RESUBMITTED");
        auditService.logDataEvent(currentUserId(), currentRole(), "RESUBMIT", "AssetDeclaration", saved.getId(),
                "Resubmitted declaration as a new version");
        governanceAuditService.logAction(saved.getId(), "DECLARATION", currentUserId(), "RESUBMIT",
                "Resubmitted declaration version " + saved.getVersionNumber());
        return buildCompleteResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public AcknowledgementResponse getAcknowledgement(Long id) {
        AssetDeclaration declaration = findOrThrow(id);
        assertAccess(declaration);
        if (declaration.getStatus() != DeclarationStatus.APPROVED) {
            throw new IllegalStateException("Acknowledgement is only available for APPROVED declarations.");
        }
        return AcknowledgementResponse.builder()
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .downloadUrl(fileStorageService.presignedUrl(declaration.getAcknowledgementDocFilePath()))
                .generatedAt(declaration.getAcknowledgedAt() != null ? declaration.getAcknowledgedAt() : LocalDateTime.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public org.springframework.core.io.Resource downloadAcknowledgement(Long id) {
        AssetDeclaration declaration = findOrThrow(id);
        assertAccess(declaration);
        if (declaration.getStatus() != DeclarationStatus.APPROVED) {
            throw new IllegalStateException("Acknowledgement is only available for APPROVED declarations.");
        }
        if (declaration.getAcknowledgementDocFilePath() == null || declaration.getAcknowledgementDocFilePath().isBlank()) {
            throw new IllegalStateException("Acknowledgement document is not available for declaration id=" + id);
        }
        return fileStorageService.loadAsResource(declaration.getAcknowledgementDocFilePath());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<DeclarationDiffResponse> getDiff(Long id, Integer compareToVersion) {
        AssetDeclaration current = findOrThrow(id);
        assertAccess(current);

        AssetDeclaration baseline = null;
        if (compareToVersion != null) {
            baseline = declarationRepository.findByTempleIdAndFinancialYearAndVersionNumber(
                    current.getTempleId(), current.getFinancialYear(), compareToVersion).orElse(null);
        } else {
            baseline = declarationRepository.findAllByTempleIdAndFinancialYearOrderByVersionNumberDesc(
                            current.getTempleId(), current.getFinancialYear())
                    .stream()
                    .filter(item -> item.getVersionNumber() < current.getVersionNumber())
                    .findFirst()
                    .orElse(null);
        }

        if (baseline == null) {
            return List.of();
        }

        JsonNode left = objectToTree(buildCompleteResponse(baseline));
        JsonNode right = objectToTree(buildCompleteResponse(current));
        List<DeclarationDiffResponse> diffs = new ArrayList<>();
        collectDiffs("", left, right, diffs);
        return diffs;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<ClarificationItemResponse> listClarifications(Long declarationId) {
        AssetDeclaration declaration = findOrThrow(declarationId);
        assertAccess(declaration);
        return clarificationRepository.findAllByDeclarationIdOrderByCreatedAtAsc(declarationId).stream()
                .map(item -> ClarificationItemResponse.builder()
                        .id(item.getId())
                        .direction(item.getDirection().name())
                        .message(item.getMessage())
                        .sectionName(item.getSectionName())
                        .fieldNamesJson(item.getFieldNamesJson())
                        .authorId(item.getAuthorId())
                        .createdAt(item.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<DeclarationVersionResponse> listVersions(Long declarationId) {
        AssetDeclaration declaration = findOrThrow(declarationId);
        assertAccess(declaration);
        return versionRepository.findByDeclarationIdOrderByVersionNumberDesc(declarationId).stream()
                .map(version -> {
                    JsonNode snapshot = safeReadTree(version.getSnapshotJson());
                    return DeclarationVersionResponse.builder()
                            .id(version.getId())
                            .versionNumber(version.getVersionNumber())
                            .status(parseStatus(snapshot.path("status").asText(null)))
                            .submittedAt(parseDateTime(snapshot.path("submittedAt").asText(null)))
                            .reviewedAt(parseDateTime(snapshot.path("reviewedAt").asText(null)))
                            .acknowledgementNumber(text(snapshot, "acknowledgementNumber"))
                            .reviewedBy(snapshot.path("reviewedBy").isNull() ? null : snapshot.path("reviewedBy").asLong())
                            .remarks(text(snapshot, "remarks"))
                            .createdAt(version.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public void forceDraft(Long id) {
        AssetDeclaration declaration = findOrThrow(id);
        declaration.setStatus(DeclarationStatus.DRAFT);
        declarationRepository.save(declaration);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<com.templeregistry.dto.response.declaration.AuditLogEntry> listAuditLog(Long declarationId) {
        AssetDeclaration declaration = findOrThrow(declarationId);
        assertAccess(declaration);
        return declarationAuditLogService.findByDeclaration(declarationId);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public PaginatedResponse<DeclarationResponse> listOverdue(Long districtId, int page, int size) {
        PageRequest pageable = PageRequest.of(page, paginationUtil.clampSize(size),
                Sort.by(Sort.Order.asc("dueDate")));
        return PaginatedResponse.of(
                declarationRepository.findByIsOverdueTrueAndDistrictId(districtId, pageable)
                        .map(this::toSummaryResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public PaginatedResponse<DeclarationResponse> getPhysicalVerificationPending(int page, int size) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(30);
        PageRequest pageable = PageRequest.of(page, paginationUtil.clampSize(size), Sort.by(Sort.Order.asc("submittedAt")));
        return PaginatedResponse.of(
                declarationRepository.findPhysicalVerificationPendingOlderThan(threshold, pageable).map(this::toSummaryResponse));
    }

    @Override
    @Transactional
    public void flagOverdue() {
        LocalDate today = LocalDate.now();
        List<AssetDeclaration> overdue = declarationRepository.findDeclarationsToFlagAsOverdue(today);
        for (AssetDeclaration declaration : overdue) {
            declaration.setOverdue(true);
            declaration.setOverdueFlaggedAt(LocalDateTime.now());
            if (declaration.getStatus() == DeclarationStatus.DRAFT) {
                declaration.setStatus(DeclarationStatus.OVERDUE);
            }
            declarationRepository.save(declaration);
            if (declaration.getSubmittedBy() != null) {
                notificationPublisher.publish(declaration.getSubmittedBy(), "DECLARATION_OVERDUE",
                        declaration.getId(), "ASSET_DECLARATION");
            }
        }
    }

    private AssetDeclaration findOrThrow(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", id));
    }

    private Temple findTempleOrThrow(Long templeId) {
        return templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    private void assertAccess(AssetDeclaration declaration) {
        ScopeHelper.Claims claims = currentClaims();
        String role = claims.role();
        if (RoleConstants.TEMPLE_AUTHORITY.equals(role)) {
            ownershipGuard.assertOwnsTemple(declaration.getTempleId());
            return;
        }
        if (RoleConstants.DISTRICT_COLLECTOR.equals(role)
                || RoleConstants.DC_STAFF.equals(role)
                || RoleConstants.AUDITOR.equals(role)) {
            jurisdictionGuard.assertSameDistrict(declaration.getDistrictId());
        }
    }

    private void replaceAssetItems(Long declarationId, CreateDeclarationRequest request) {
        agriLandRepository.deleteByDeclarationId(declarationId);
        buildingRepository.deleteByDeclarationId(declarationId);
        leasedRepository.deleteByDeclarationId(declarationId);
        otherLandRepository.deleteByDeclarationId(declarationId);
        preciousMetalRepository.deleteByDeclarationId(declarationId);
        artifactRepository.deleteByDeclarationId(declarationId);
        vehicleRepository.deleteByDeclarationId(declarationId);
        equipmentRepository.deleteByDeclarationId(declarationId);
        financialRepository.deleteByDeclarationId(declarationId);

        agriLandRepository.saveAll(request.getAgriculturalLands().stream()
                .map(item -> assetMapper.toAgriLandEntity(item, declarationId)).toList());
        buildingRepository.saveAll(request.getBuildings().stream()
                .map(item -> assetMapper.toBuildingEntity(item, declarationId)).toList());
        leasedRepository.saveAll(request.getLeasedProperties().stream()
                .map(item -> assetMapper.toLeasedPropertyEntity(item, declarationId)).toList());
        otherLandRepository.saveAll(request.getOtherLands().stream()
                .map(item -> assetMapper.toOtherLandEntity(item, declarationId)).toList());
        preciousMetalRepository.saveAll(request.getPreciousMetals().stream()
                .map(item -> assetMapper.toPreciousMetalEntity(item, declarationId)).toList());
        artifactRepository.saveAll(request.getArtifacts().stream()
                .map(item -> assetMapper.toArtifactEntity(item, declarationId)).toList());
        vehicleRepository.saveAll(request.getVehicles().stream()
                .map(item -> assetMapper.toVehicleEntity(item, declarationId)).toList());
        equipmentRepository.saveAll(request.getEquipment().stream()
                .map(item -> assetMapper.toEquipmentEntity(item, declarationId)).toList());
        financialRepository.saveAll(request.getFinancialAssets().stream()
                .map(item -> assetMapper.toFinancialAssetEntity(item, declarationId)).toList());
    }

    private void applySummaryFields(AssetDeclaration declaration, CreateDeclarationRequest request) {
        declaration.setAgriculturalLandAcres(sum(request.getAgriculturalLands().stream()
                .map(item -> item.getAreaAcres()).toList()));
        declaration.setAgriculturalLandValue(null);
        declaration.setBuildingsSqft(sum(request.getBuildings().stream()
                .map(item -> item.getTotalAreaSqft()).toList()));
        declaration.setBuildingsValue(sum(request.getBuildings().stream()
                .map(item -> item.getValuationInr()).toList()));
        declaration.setLeasedPropertiesCount(request.getLeasedProperties().size());
        declaration.setLeasedPropertiesValue(sum(request.getLeasedProperties().stream()
                .map(item -> item.getMonthlyRent()).toList()));
        declaration.setOtherLandValue(null);
        declaration.setGoldGrams(sum(request.getPreciousMetals().stream()
                .filter(item -> isMetalType(item, "GOLD"))
                .map(PreciousMetalItemRequest::getWeightGrams).toList()));
        declaration.setSilverGrams(sum(request.getPreciousMetals().stream()
                .filter(item -> isMetalType(item, "SILVER"))
                .map(PreciousMetalItemRequest::getWeightGrams).toList()));
        declaration.setIdolsCount(request.getArtifacts().size());
        declaration.setVehiclesCount(request.getVehicles().size());
        declaration.setFinancialAssetsValue(sum(request.getFinancialAssets().stream()
                .map(FinancialAssetItemRequest::getAmount).toList()));
        declaration.setOtherMovableValue(sum(request.getEquipment().stream()
                .map(EquipmentItemRequest::getApproximateValueInr).toList()));
    }

    private boolean isMetalType(PreciousMetalItemRequest item, String expectedType) {
        return item.getMetalType() != null && expectedType.equalsIgnoreCase(item.getMetalType().trim());
    }

    private BigDecimal sum(List<BigDecimal> values) {
        return values.stream().filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private CompleteDeclarationResponse buildCompleteResponse(AssetDeclaration declaration) {
        String templeName = templeRepository.findById(declaration.getTempleId()).map(Temple::getName).orElse(null);
        return CompleteDeclarationResponse.builder()
                .id(declaration.getId())
                .workflowInstanceId(workflowEngineAdaptor.getWorkflowInstanceId(
                    WorkflowEntityType.DECLARATION, declaration.getId()))
                .templeId(declaration.getTempleId())
                .templeName(templeName)
                .districtId(declaration.getDistrictId())
                .financialYear(declaration.getFinancialYear())
                .status(declaration.getStatus())
                .versionNumber(declaration.getVersionNumber())
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .dueDate(declaration.getDueDate())
                .submittedAt(declaration.getSubmittedAt())
                .reviewedAt(declaration.getReviewedAt())
                .reviewedBy(declaration.getReviewedBy())
                .acknowledgedAt(declaration.getAcknowledgedAt())
                .clarificationRound(declaration.getClarificationRound())
                .overdue(declaration.isOverdue())
                .overdueFlaggedAt(declaration.getOverdueFlaggedAt())
                .remarks(declaration.getReviewComment())
                .annualIncome(declaration.getAnnualIncome())
                .annualExpenditure(declaration.getAnnualExpenditure())
                .agriculturalLandAcres(declaration.getAgriculturalLandAcres())
                .agriculturalLandValue(declaration.getAgriculturalLandValue())
                .buildingsSqft(declaration.getBuildingsSqft())
                .buildingsValue(declaration.getBuildingsValue())
                .leasedPropertiesCount(declaration.getLeasedPropertiesCount())
                .leasedPropertiesValue(declaration.getLeasedPropertiesValue())
                .otherLandValue(declaration.getOtherLandValue())
                .goldGrams(declaration.getGoldGrams())
                .silverGrams(declaration.getSilverGrams())
                .idolsCount(declaration.getIdolsCount())
                .vehiclesCount(declaration.getVehiclesCount())
                .financialAssetsValue(declaration.getFinancialAssetsValue())
                .otherMovableValue(declaration.getOtherMovableValue())
                .agriculturalLands(agriLandRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toAgriLandResponse).toList())
                .buildings(buildingRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toBuildingResponse).toList())
                .leasedProperties(leasedRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toLeasedPropertyResponse).toList())
                .otherLands(otherLandRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toOtherLandResponse).toList())
                .preciousMetals(preciousMetalRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toPreciousMetalResponse).toList())
                .artifacts(artifactRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toArtifactResponse).toList())
                .vehicles(vehicleRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toVehicleResponse).toList())
                .equipment(equipmentRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toEquipmentResponse).toList())
                .financialAssets(financialRepository.findAllByDeclarationId(declaration.getId()).stream()
                        .map(assetMapper::toFinancialAssetResponse).toList())
                .build();
    }

    private DeclarationResponse toSummaryResponse(AssetDeclaration declaration) {
        return toSummaryResponse(declaration, null);
    }

    private DeclarationResponse toSummaryResponse(AssetDeclaration declaration, Map<Long, String> templeNames) {
        String templeName = templeNames != null
                ? templeNames.getOrDefault(declaration.getTempleId(), null)
                : templeRepository.findById(declaration.getTempleId()).map(Temple::getName).orElse(null);
        return DeclarationResponse.builder()
                .id(declaration.getId())
                .workflowInstanceId(workflowEngineAdaptor.getWorkflowInstanceId(
                    WorkflowEntityType.DECLARATION, declaration.getId()))
                .templeId(declaration.getTempleId())
                .templeName(templeName)
                .districtId(declaration.getDistrictId())
                .financialYear(declaration.getFinancialYear())
                .versionNumber(declaration.getVersionNumber())
                .status(declaration.getStatus())
                .agriculturalLandAcres(declaration.getAgriculturalLandAcres())
                .agriculturalLandValue(declaration.getAgriculturalLandValue())
                .buildingsSqft(declaration.getBuildingsSqft())
                .buildingsValue(declaration.getBuildingsValue())
                .leasedPropertiesCount(declaration.getLeasedPropertiesCount())
                .leasedPropertiesValue(declaration.getLeasedPropertiesValue())
                .otherLandValue(declaration.getOtherLandValue())
                .goldGrams(declaration.getGoldGrams())
                .silverGrams(declaration.getSilverGrams())
                .idolsCount(declaration.getIdolsCount())
                .vehiclesCount(declaration.getVehiclesCount())
                .financialAssetsValue(declaration.getFinancialAssetsValue())
                .otherMovableValue(declaration.getOtherMovableValue())
                .submittedAt(declaration.getSubmittedAt())
                .reviewedAt(declaration.getReviewedAt())
                .reviewedBy(declaration.getReviewedBy())
                .acknowledgementNumber(declaration.getAcknowledgementNumber())
                .dueDate(declaration.getDueDate())
                .overdue(declaration.isOverdue())
                .overdueFlaggedAt(declaration.getOverdueFlaggedAt())
                .remarks(declaration.getReviewComment())
                .build();
    }

    private String serialize(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to serialize declaration snapshot.", ex);
        }
    }

    private JsonNode objectToTree(Object value) {
        return objectMapper.valueToTree(value);
    }

    private void collectDiffs(String path, JsonNode left, JsonNode right, List<DeclarationDiffResponse> diffs) {
        if (Objects.equals(left, right)) return;

        if (left == null || right == null || left.isValueNode() || right.isValueNode()) {
            diffs.add(DeclarationDiffResponse.builder()
                    .field(path.isBlank() ? "declaration" : path)
                    .oldValue(stringify(left))
                    .newValue(stringify(right))
                    .build());
            return;
        }

        if (left.isArray() || right.isArray()) {
            int max = Math.max(left.isArray() ? left.size() : 0, right.isArray() ? right.size() : 0);
            for (int i = 0; i < max; i++) {
                JsonNode l = left.isArray() && i < left.size() ? left.get(i) : null;
                JsonNode r = right.isArray() && i < right.size() ? right.get(i) : null;
                collectDiffs(path + "[" + i + "]", l, r, diffs);
            }
            return;
        }

        Set<String> fieldNames = new java.util.LinkedHashSet<>();
        left.fieldNames().forEachRemaining(fieldNames::add);
        right.fieldNames().forEachRemaining(fieldNames::add);
        for (String fieldName : fieldNames) {
            String childPath = path.isBlank() ? fieldName : path + "." + fieldName;
            collectDiffs(childPath, left.get(fieldName), right.get(fieldName), diffs);
        }
    }

    private String stringify(JsonNode node) {
        if (node == null || node.isNull()) return null;
        return node.isValueNode() ? node.asText() : node.toString();
    }

    private void notifyDistrictReviewers(AssetDeclaration declaration, String templateKey) {
        userRepository.findAllByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, declaration.getDistrictId())
                .forEach(dc -> notificationPublisher.publish(dc.getId(), templateKey, declaration.getId(), "ASSET_DECLARATION"));
        userRepository.findAllByRoleAndDistrictId(UserRole.DC_STAFF, declaration.getDistrictId())
                .forEach(staff -> notificationPublisher.publish(staff.getId(), templateKey, declaration.getId(), "ASSET_DECLARATION"));
    }

    private JsonNode safeReadTree(String json) {
        try {
            return json == null ? objectMapper.getNodeFactory().nullNode() : objectMapper.readTree(json);
        } catch (Exception ex) {
            return objectMapper.getNodeFactory().nullNode();
        }
    }

    private DeclarationStatus parseStatus(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return DeclarationStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private static DeclarationStatus resolveStatus(String raw) {
        String normalised = raw.toUpperCase();
        String canonical  = LEGACY_ALIASES.getOrDefault(normalised, normalised);
        return DeclarationStatus.valueOf(canonical);
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank() || "null".equalsIgnoreCase(value)) return null;
        try {
            return LocalDateTime.parse(value);
        } catch (Exception ex) {
            return null;
        }
    }

    private String text(JsonNode node, String field) {
        JsonNode value = node.path(field);
        return value.isMissingNode() || value.isNull() ? null : value.asText();
    }

    private ScopeHelper.Claims currentClaims() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims claims) return claims;
        throw new IllegalStateException("No authenticated claims available.");
    }

    private Long currentUserId() { return currentClaims().userId(); }
    private String currentRole() { return currentClaims().role(); }
}
