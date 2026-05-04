package com.templeregistry.service.impl.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.service.workflow.WorkflowActionRequest;
import com.templeregistry.service.workflow.ActionContext;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowAction;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.util.PaginationUtil;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.service.workflow.VersionService;
import com.templeregistry.service.clarification.ClarificationEngine;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TempleProfileStagingServiceImpl implements TempleProfileStagingService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TempleProfileStagingServiceImpl.class);

    private final TempleProfileStagingRepository stagingRepository;
    private final TempleRepository templeRepository;
    private final TempleSearchSummaryService summaryService;
    private final OwnershipGuard ownershipGuard;
    private final PaginationUtil paginationUtil;
    private final WorkflowEngine workflowEngine;
    private final VersionService versionService;
    private final ClarificationEngine clarificationEngine;
    private final com.templeregistry.service.workflow.ActionContextResolver actionContextResolver;

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TempleProfileStagingResponse createOrUpdateDraft(Long templeId, CreateTempleProfileStagingRequest request) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = findTempleOrThrow(templeId);
        assertNotSuspended(temple);

        // EC-04: If a PENDING_REVIEW staging record exists, editing is locked
        Optional<TempleProfileStaging> pending = stagingRepository
                .findFirstByTempleIdAndStatus(templeId, com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED);
        if (pending.isPresent()) {
            throw new IllegalStateException(
                    "A profile submission is already under DC review (status: SUBMITTED). "
                            + "Editing is locked until DC responds.");
        }

        // Find or create DRAFT
        TempleProfileStaging staging = stagingRepository
                .findFirstByTempleIdAndStatus(templeId, com.templeregistry.entity.workflow.WorkflowStatus.DRAFT)
                .orElseGet(() -> {
                    int nextVersion = stagingRepository.findMaxVersionNumberByTempleId(templeId)
                            .map(v -> v + 1).orElse(1);
                    return TempleProfileStaging.builder()
                            .templeId(templeId)
                            .build();
                });

        applyFields(staging, request);
        TempleProfileStaging saved = stagingRepository.save(staging);
        
        // ── Workflow Engine: ensure instance exists on first save ──────────────
        // initiate() is now idempotent — it returns the existing instance if one already
        // exists, so no existence check is needed here. This eliminates the TOCTOU race
        // that the previous existsByEntityTypeAndEntityId() check introduced: two concurrent
        // requests could both pass the exists() check before either called initiate(),
        // causing the second to throw WorkflowException. Now both calls safely converge
        // on the same instance row via the unique index (entity_type, entity_id).
        workflowEngine.initiate(
            WorkflowEntityType.TEMPLE_PROFILE,
            saved.getId(),
            templeId,
            temple.getDistrictId(),
            currentUserId()
        );
        
        log.info("Temple profile staging draft saved: stagingId=[{}] templeId=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TempleProfileStagingResponse submitForReview(Long templeId) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = findTempleOrThrow(templeId);
        assertNotSuspended(temple);

        TempleProfileStaging staging = stagingRepository
            .findFirstByTempleIdAndStatus(templeId, com.templeregistry.entity.workflow.WorkflowStatus.DRAFT)
            .orElseThrow(() -> new EntityNotFoundException(
                "No DRAFT temple profile staging found for temple [" + templeId + "]",
                "TEMPLE_PROFILE_STAGING_DRAFT_NOT_FOUND"));

        // Canonical: WorkflowEngine handles the SUBMIT transition
        WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, staging.getId());
        
        workflowEngine.execute(
            instance.getId(),
            WorkflowActionRequest.builder()
                .action(WorkflowAction.SUBMIT)
                .expectedVersion(instance.getLockVersion())
                .idempotencyKey(UUID.randomUUID().toString())
                .build(),
            actionContextResolver.resolve(ScopeHelper.Claims.fromContext())
        );

        // Snapshot domain entity for versioning
        versionService.snapshot(WorkflowEntityType.TEMPLE_PROFILE, staging.getId(), instance.getVersionNumber(), staging, currentUserId(), null);

        log.info("Temple profile submitted for review (NOT promoted): stagingId=[{}] templeId=[{}]", staging.getId(), templeId);

        return toResponse(staging);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public TempleProfileStagingResponse approve(Long templeId, Long stagingId) {
        TempleProfileStaging staging = findStagingOrThrow(stagingId);
        WorkflowInstance workflowInstance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, stagingId);
        
        if (workflowInstance.getStatus() != com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED) {
            throw new IllegalStateException(
                    "Only SUBMITTED staging records can be approved. Current status: " + workflowInstance.getStatus());
        }
        Temple temple = findTempleOrThrow(templeId);

        // Mark any previous APPROVED staging as SUPERSEDED via WorkflowEngine
        stagingRepository.findFirstByTempleIdAndStatus(templeId, com.templeregistry.entity.workflow.WorkflowStatus.APPROVED)
                .ifPresent(prev -> {
                    WorkflowInstance prevInstance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, prev.getId());
                    workflowEngine.executeSystem(prevInstance.getId(), WorkflowAction.REJECT, "Superseded by stagingId=" + stagingId);
                });

        // CORRECT: Promote staging fields to the Temple entity ONLY on approval
        promoteToTemple(temple, staging);
        templeRepository.save(temple);

        // ── Workflow Engine: execute APPROVE action ─────────────────────────────
        workflowEngine.execute(
            workflowInstance.getId(),
            WorkflowActionRequest.builder()
                .action(WorkflowAction.APPROVE)
                .expectedVersion(workflowInstance.getLockVersion())
                .idempotencyKey(UUID.randomUUID().toString())
                .build(),
            actionContextResolver.resolve(ScopeHelper.Claims.fromContext())
        );

        // [P2] Snapshot on approval using canonical version
        versionService.snapshot(WorkflowEntityType.TEMPLE_PROFILE, stagingId, workflowInstance.getVersionNumber(), staging, currentUserId(), null);

        log.info("Temple profile staging approved and promoted: stagingId=[{}] templeId=[{}]", stagingId, templeId);
        
        // [P3] Manual notificationHelper removed — event outbox takes over.

        return toResponse(staging);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public TempleProfileStagingResponse reject(Long templeId, Long stagingId, String dcComment) {
        TempleProfileStaging staging = findStagingOrThrow(stagingId);
        WorkflowInstance workflowInstance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, stagingId);
        
        if (workflowInstance.getStatus() != com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED) {
            throw new IllegalStateException(
                    "Only SUBMITTED staging records can be rejected. Current status: " + workflowInstance.getStatus());
        }
        Temple temple = findTempleOrThrow(templeId);

        // ── Workflow Engine: execute REJECT action ──────────────────────────────
        workflowEngine.execute(
            workflowInstance.getId(),
            WorkflowActionRequest.builder()
                .action(WorkflowAction.REJECT)
                .expectedVersion(workflowInstance.getLockVersion())
                .idempotencyKey(UUID.randomUUID().toString())
                .comment(dcComment)
                .build(),
            actionContextResolver.resolve(ScopeHelper.Claims.fromContext())
        );

        // [P2] Snapshot on rejection using canonical version
        versionService.snapshot(WorkflowEntityType.TEMPLE_PROFILE, stagingId, workflowInstance.getVersionNumber(), staging, currentUserId(), null);

        log.info("Temple profile staging rejected: stagingId=[{}] templeId=[{}] reason=[{}]",
                stagingId, templeId, dcComment);
        
        // [P3] Manual notificationHelper removed — event outbox takes over.

        return toResponse(staging);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TempleProfileStagingResponse getActiveStagingOrNull(Long templeId) {
        ownershipGuard.assertOwnsTemple(templeId);
        return stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                templeId, List.of(com.templeregistry.entity.workflow.WorkflowStatus.DRAFT, com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED))
                .map(this::toResponse).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TempleProfileStagingResponse getById(Long id) {
        return toResponse(findStagingOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<TempleProfileStagingResponse> getHistory(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        Page<TempleProfileStaging> result = stagingRepository.findAllByTempleIdOrderByVersionNumberDesc(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_ACT_DC)
    public void requestClarification(Long templeId, Long stagingId, String message, Long requestedByUserId) {
        TempleProfileStaging staging = findStagingOrThrow(stagingId);
        
        // [P6] Canonical: ClarificationEngine handles thread creation + WorkflowEngine transition
        WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, stagingId);

        clarificationEngine.requestClarification(
            instance.getId(),
            com.templeregistry.service.clarification.ClarificationRequest.builder()
                .message(message)
                .build(),
            requestedByUserId,
            null);

        log.info("Clarification requested for temple profile staging [{}] by userId={}", stagingId, requestedByUserId);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public void respondToClarification(Long templeId, Long threadId, String response, Long respondedByUserId) {
        // [P6] Canonical: ClarificationEngine handles response + WorkflowEngine transition
        clarificationEngine.respond(threadId, 
            com.templeregistry.service.clarification.ClarificationResponse.builder()
                .message(response)
                .build(), 
            respondedByUserId);
        
        log.info("Clarification response submitted for thread [{}] by userId={}", threadId, respondedByUserId);
    }

    /* ── Helpers ─────────────────────────────────────────── */

    private Temple findTempleOrThrow(Long templeId) {
        return templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    private TempleProfileStaging findStagingOrThrow(Long stagingId) {
        return stagingRepository.findById(stagingId)
                .orElseThrow(() -> new EntityNotFoundException("TempleProfileStaging", stagingId));
    }

    private void assertNotSuspended(Temple temple) {
        if (temple.getStatus() == TempleStatus.SUSPENDED) {
            throw new IllegalStateException(
                    "Temple [" + temple.getId() + "] is currently SUSPENDED. "
                            + "Profile edits are disabled. Contact the District Collector's office.");
        }
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }

    private ActionContext buildActionContext(Long districtId) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims claims) {
            String role = claims.districtId() != null ? "DC" : "TA";
            return ActionContext.builder()
                .actorId(claims.userId())
                .actorRole(role)
                .actorDistrictId(claims.districtId())
                .ownedTempleIds(claims.templeIds() != null ? claims.templeIds() : java.util.Set.of())
                .build();
        }
        // Fallback for system/test contexts
        return ActionContext.builder()
            .actorId(0L)
            .actorRole("SYSTEM")
            .build();
    }

    private void applyFields(TempleProfileStaging staging, CreateTempleProfileStagingRequest rq) {
        if (normalized(rq.getPhone()) != null)                    staging.setPhone(normalized(rq.getPhone()));
        if (normalized(rq.getEmail()) != null)                    staging.setEmail(normalized(rq.getEmail()));
        if (normalized(rq.getWebsite()) != null)                  staging.setWebsite(normalized(rq.getWebsite()));
        if (normalized(rq.getContactPersonName()) != null)        staging.setContactPersonName(normalized(rq.getContactPersonName()));
        if (normalized(rq.getContactPersonDesignation()) != null) staging.setContactPersonDesignation(normalized(rq.getContactPersonDesignation()));
        if (normalized(rq.getPhotoFilePath()) != null)            staging.setPhotoFilePath(normalized(rq.getPhotoFilePath()));
        // Plain text; AesEncryptionConverter transparently encrypts on JPA save (AES-256-GCM)
        if (normalized(rq.getBankAccountNumber()) != null)        staging.setBankAccountNumberEncrypted(normalized(rq.getBankAccountNumber()));
        if (normalized(rq.getBankName()) != null)                 staging.setBankName(normalized(rq.getBankName()));
        if (normalized(rq.getBankIfsc()) != null)                 staging.setBankIfsc(normalized(rq.getBankIfsc()).toUpperCase());
        if (normalized(rq.getLanguagesOfWorship()) != null)       staging.setLanguagesOfWorship(normalized(rq.getLanguagesOfWorship()));
        if (normalized(rq.getLinkedInstitutions()) != null)       staging.setLinkedInstitutions(normalized(rq.getLinkedInstitutions()));
        if (normalized(rq.getDescription()) != null)              staging.setDescription(normalized(rq.getDescription()));
        if (normalized(rq.getAnnualFestivals()) != null)          staging.setAnnualFestivals(normalized(rq.getAnnualFestivals()));
        if (normalized(rq.getLandmark()) != null)                 staging.setLandmark(normalized(rq.getLandmark()));
        if (normalized(rq.getHistoricalSignificance()) != null)   staging.setHistoricalSignificance(normalized(rq.getHistoricalSignificance()));
    }

    private String normalized(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void promoteToTemple(Temple temple, TempleProfileStaging staging) {
        if (staging.getContactPersonName() != null)
            temple.setContactName(staging.getContactPersonName());
        if (staging.getContactPersonDesignation() != null)
            temple.setContactDesignation(staging.getContactPersonDesignation());
        if (staging.getLanguagesOfWorship() != null)
            temple.setLanguagesOfWorship(staging.getLanguagesOfWorship());
        if (staging.getPhotoFilePath() != null)
            temple.setPhotoUrl(staging.getPhotoFilePath());
        if (staging.getPhone() != null)
            temple.setContactMobile(staging.getPhone());
        if (staging.getEmail() != null)
            temple.setContactEmail(staging.getEmail());
        if (staging.getWebsite() != null)
            temple.setWebsite(staging.getWebsite());
        if (staging.getDescription() != null)
            temple.setHistory(staging.getDescription());
        else if (staging.getHistoricalSignificance() != null)
            temple.setHistory(staging.getHistoricalSignificance());
        if (staging.getAnnualFestivals() != null)
            temple.setAnnualFestivals(staging.getAnnualFestivals());
        if (staging.getLandmark() != null)
            temple.setLandmark(staging.getLandmark());
        if (staging.getHistoricalSignificance() != null)
            temple.setHistoricalSignificance(staging.getHistoricalSignificance());
        if (staging.getBankName() != null)
            temple.setBankName(staging.getBankName());
        if (staging.getBankIfsc() != null)
            temple.setBankIfsc(staging.getBankIfsc());
        if (staging.getLinkedInstitutions() != null)
            temple.setLinkedInstitutions(staging.getLinkedInstitutions());
    }

    private final FileStorageService fileStorageService;

    private TempleProfileStagingResponse toResponse(TempleProfileStaging s) {
        WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, s.getId());

        // VAL-008: bank account — show last 4 digits only (never echo full number)
        String masked = null;
        if (s.getBankAccountNumberEncrypted() != null && s.getBankAccountNumberEncrypted().length() >= 4) {
            String raw = s.getBankAccountNumberEncrypted();
            masked = "****" + raw.substring(raw.length() - 4);
        }

        String photoUrl = null;
        if (s.getPhotoFilePath() != null && !s.getPhotoFilePath().isBlank()) {
            photoUrl = fileStorageService.presignedUrl(s.getPhotoFilePath());
        }

        return TempleProfileStagingResponse.builder()
                .id(s.getId())
                .workflowInstanceId(instance.getId())
                .templeId(s.getTempleId())
                .versionNumber(instance.getVersionNumber())
                .statusLabel(instance.getStatus().name())
                .phone(s.getPhone())
                .email(s.getEmail())
                .website(s.getWebsite())
                .contactPersonName(s.getContactPersonName())
                .contactPersonDesignation(s.getContactPersonDesignation())
                .photoUrl(photoUrl)
                .bankAccountMasked(masked)
                .bankName(s.getBankName())
                .bankIfsc(s.getBankIfsc())
                .languagesOfWorship(s.getLanguagesOfWorship())
                .linkedInstitutions(s.getLinkedInstitutions())
                .description(s.getDescription())
                .annualFestivals(s.getAnnualFestivals())
                .landmark(s.getLandmark())
                .historicalSignificance(s.getHistoricalSignificance())
                .submittedAt(instance.getSubmittedAt() != null ? LocalDateTime.ofInstant(instance.getSubmittedAt(), java.time.ZoneId.systemDefault()) : null)
                .reviewedAt(instance.getStatusUpdatedAt() != null ? LocalDateTime.ofInstant(instance.getStatusUpdatedAt(), java.time.ZoneId.systemDefault()) : null)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
