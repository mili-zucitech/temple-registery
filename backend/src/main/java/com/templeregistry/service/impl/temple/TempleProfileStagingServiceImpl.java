package com.templeregistry.service.impl.temple;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class TempleProfileStagingServiceImpl implements TempleProfileStagingService {
    private final com.templeregistry.mapper.temple.TempleMapper templeMapper;

    private final TempleProfileStagingRepository stagingRepository;
    private final TempleRepository templeRepository;
    private final TempleSearchSummaryService summaryService;
    private final NotificationService notificationService;
    private final OwnershipGuard ownershipGuard;
    private final PaginationUtil paginationUtil;

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TempleProfileStagingResponse createOrUpdateDraft(Long templeId, CreateTempleProfileStagingRequest request) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = findTempleOrThrow(templeId);
        assertNotSuspended(temple);

        // EC-04: If a PENDING_REVIEW staging record exists, editing is locked
        Optional<TempleProfileStaging> pending = stagingRepository
                .findFirstByTempleIdAndStatus(templeId, TempleProfileStagingStatus.PENDING_REVIEW);
        if (pending.isPresent()) {
            throw new IllegalStateException(
                    "A profile submission is already under DC review (status: SUBMITTED). "
                            + "Editing is locked until DC responds.");
        }

        // Find or create DRAFT
        TempleProfileStaging staging = stagingRepository
                .findFirstByTempleIdAndStatus(templeId, TempleProfileStagingStatus.DRAFT)
                .orElseGet(() -> {
                    int nextVersion = stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(templeId)
                            .map(s -> s.getVersionNumber() + 1).orElse(1);
                    return TempleProfileStaging.builder()
                            .templeId(templeId)
                            .versionNumber(nextVersion)
                            .status(TempleProfileStagingStatus.DRAFT)
                            .build();
                });

        applyFields(staging, request);
        TempleProfileStaging saved = stagingRepository.save(staging);
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
                .findFirstByTempleIdAndStatus(templeId, TempleProfileStagingStatus.DRAFT)
                .orElseThrow(() -> new EntityNotFoundException(
                        "No DRAFT temple profile staging found for temple [" + templeId + "]",
                        "TEMPLE_PROFILE_STAGING_DRAFT_NOT_FOUND"));

        staging.setStatus(TempleProfileStagingStatus.PENDING_REVIEW);
        staging.setSubmittedAt(LocalDateTime.now());
        staging.setSubmittedBy(currentUserId());
        TempleProfileStaging saved = stagingRepository.save(staging);

        // Notification trigger #3: DC notified
        notificationService.notify(
                null, // DC notification — placeholder; real impl looks up DC user for this temple's
                      // district
                "Temple Profile Submitted for Review",
                "Temple [" + templeId + "] has submitted a profile update for your review.",
                "TEMPLE_PROFILE_STAGING", saved.getId());

        log.info("Temple profile staging submitted: stagingId=[{}] templeId=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public TempleProfileStagingResponse approve(Long templeId, Long stagingId) {
        TempleProfileStaging staging = findStagingOrThrow(stagingId);
        if (staging.getStatus() != TempleProfileStagingStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                    "Only PENDING_REVIEW staging records can be approved. Current status: " + staging.getStatus());
        }
        Temple temple = findTempleOrThrow(templeId);

        // Mark any previous APPROVED staging as SUPERSEDED
        stagingRepository.findFirstByTempleIdAndStatus(templeId, TempleProfileStagingStatus.APPROVED)
                .ifPresent(prev -> {
                    prev.setStatus(TempleProfileStagingStatus.SUPERSEDED);
                    stagingRepository.save(prev);
                });

        // Promote staging fields to the Temple entity
        promoteToTemple(temple, staging);
        templeRepository.save(temple);

        staging.setStatus(TempleProfileStagingStatus.APPROVED);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(currentUserId());
        TempleProfileStaging saved = stagingRepository.save(staging);

        summaryService.refresh(templeId);

        // Notification trigger #4: TA notified
        notificationService.notify(
                staging.getSubmittedBy(),
                "Temple Profile Approved",
                "Your temple profile update has been approved by the District Collector.",
                "TEMPLE_PROFILE_STAGING", saved.getId());

        log.info("Temple profile staging approved: stagingId=[{}] templeId=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public TempleProfileStagingResponse reject(Long templeId, Long stagingId, String dcComment) {
        TempleProfileStaging staging = findStagingOrThrow(stagingId);
        if (staging.getStatus() != TempleProfileStagingStatus.PENDING_REVIEW) {
            throw new IllegalStateException(
                    "Only PENDING_REVIEW staging records can be rejected. Current status: " + staging.getStatus());
        }
        staging.setStatus(TempleProfileStagingStatus.REJECTED);
        staging.setReviewComment(dcComment);
        staging.setReviewedAt(LocalDateTime.now());
        staging.setReviewedBy(currentUserId());
        TempleProfileStaging saved = stagingRepository.save(staging);

        // Notification trigger #5: TA notified
        notificationService.notify(
                staging.getSubmittedBy(),
                "Temple Profile Rejected",
                "Your temple profile update has been rejected. Reason: " + dcComment,
                "TEMPLE_PROFILE_STAGING", saved.getId());

        log.info("Temple profile staging rejected: stagingId=[{}] templeId=[{}] reason=[{}]",
                saved.getId(), templeId, dcComment);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TempleProfileStagingResponse getActiveStagingOrNull(Long templeId) {
        ownershipGuard.assertOwnsTemple(templeId);
        return stagingRepository.findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                templeId, List.of(TempleProfileStagingStatus.DRAFT, TempleProfileStagingStatus.PENDING_REVIEW))
                .map(this::toResponse).orElse(null);
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
        if (principal instanceof ScopeHelper.Claims c)
            return c.userId();
        return 0L;
    }

    private void applyFields(TempleProfileStaging staging, CreateTempleProfileStagingRequest rq) {
        if (rq.getPhone() != null)
            staging.setPhone(rq.getPhone());
        if (rq.getEmail() != null)
            staging.setEmail(rq.getEmail());
        if (rq.getWebsite() != null)
            staging.setWebsite(rq.getWebsite());
        if (rq.getContactPersonName() != null)
            staging.setContactPersonName(rq.getContactPersonName());
        if (rq.getContactPersonDesignation() != null)
            staging.setContactPersonDesignation(rq.getContactPersonDesignation());
        if (rq.getPhotoFilePath() != null)
            staging.setPhotoFilePath(rq.getPhotoFilePath());
        // Plain text; AesEncryptionConverter transparently encrypts on JPA save
        // (AES-256-GCM)
        if (rq.getBankAccountNumber() != null)
            staging.setBankAccountNumberEncrypted(rq.getBankAccountNumber());
        if (rq.getBankName() != null)
            staging.setBankName(rq.getBankName());
        if (rq.getBankIfsc() != null)
            staging.setBankIfsc(rq.getBankIfsc());
        if (rq.getLanguagesOfWorship() != null)
            staging.setLanguagesOfWorship(templeMapper.mapToJson(rq.getLanguagesOfWorship()));
        ;
        if (rq.getLinkedInstitutions() != null)
            staging.setLinkedInstitutions(templeMapper.mapToJson(rq.getLinkedInstitutions()));
        if (rq.getDescription() != null)
            staging.setDescription(rq.getDescription());
        if (rq.getAnnualFestivals() != null)
            staging.setAnnualFestivals(rq.getAnnualFestivals());
        if (rq.getLandmark() != null)
            staging.setLandmark(rq.getLandmark());
        if (rq.getHistoricalSignificance() != null)
            staging.setHistoricalSignificance(rq.getHistoricalSignificance());
    }

    private void promoteToTemple(Temple temple, TempleProfileStaging staging) {
        if (staging.getContactPersonName() != null)
            temple.setContactName(staging.getContactPersonName());
        if (staging.getContactPersonDesignation() != null)
            temple.setContactDesignation(staging.getContactPersonDesignation());
        if (staging.getLanguagesOfWorship() != null)
            temple.setLanguagesOfWorship(staging.getLanguagesOfWorship());

    }

    private TempleProfileStagingResponse toResponse(TempleProfileStaging s) {
        // VAL-008: bank account — show last 4 digits only (never echo full number)
        String masked = null;
        if (s.getBankAccountNumberEncrypted() != null && s.getBankAccountNumberEncrypted().length() >= 4) {
            String raw = s.getBankAccountNumberEncrypted();
            masked = "****" + raw.substring(raw.length() - 4);
        }

        // DECISION-01: PENDING_REVIEW → display as SUBMITTED
        String statusLabel = switch (s.getStatus()) {
            case PENDING_REVIEW -> "SUBMITTED";
            default -> s.getStatus().name();
        };

        return TempleProfileStagingResponse.builder()
                .id(s.getId())
                .templeId(s.getTempleId())
                .versionNumber(s.getVersionNumber())
                .statusLabel(statusLabel)
                .phone(s.getPhone())
                .email(s.getEmail())
                .website(s.getWebsite())
                .contactPersonName(s.getContactPersonName())
                .contactPersonDesignation(s.getContactPersonDesignation())
                .photoFilePath(s.getPhotoFilePath())
                .bankAccountMasked(masked)
                .bankName(s.getBankName())
                .bankIfsc(s.getBankIfsc())
                .languagesOfWorship(templeMapper.mapToList(s.getLanguagesOfWorship()))
                .linkedInstitutions(templeMapper.mapToList(s.getLinkedInstitutions()))
                .description(s.getDescription())
                .annualFestivals(s.getAnnualFestivals())
                .landmark(s.getLandmark())
                .historicalSignificance(s.getHistoricalSignificance())
                .reviewComment(s.getReviewComment())
                .submittedAt(s.getSubmittedAt())
                .submittedBy(s.getSubmittedBy())
                .reviewedAt(s.getReviewedAt())
                .reviewedBy(s.getReviewedBy())
                .createdAt(s.getCreatedAt())
                .createdBy(s.getCreatedBy())
                .updatedAt(s.getUpdatedAt())
                .updatedBy(s.getUpdatedBy())
                .build();
    }
}
