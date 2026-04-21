package com.templeregistry.service.impl.ta;

import com.templeregistry.dto.request.ta.TaDocumentMetadataRequest;
import com.templeregistry.dto.request.ta.TaProfileStagingRequest;
import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.ta.TaActivityResponse;
import com.templeregistry.dto.response.ta.TaCurrentProfileResponse;
import com.templeregistry.dto.response.ta.TaDashboardResponse;
import com.templeregistry.dto.response.ta.TaDocumentResponse;
import com.templeregistry.dto.response.ta.TaProfileStatusResponse;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.entity.auth.UserRole;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.temple.TempleMapper;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.dc.TempleProfileCurrentRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.document.DocumentService;
import com.templeregistry.service.ta.TaDashboardService;
import com.templeregistry.service.temple.TempleProfileStagingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaDashboardServiceImpl implements TaDashboardService {

    private final TempleRepository templeRepository;
    private final TempleProfileStagingRepository stagingRepository;
    private final TempleProfileCurrentRepository currentRepository;
    private final TempleProfileStagingService stagingService;
    private final DocumentService documentService;
    private final AuditService auditService;
    private final OwnershipGuard ownershipGuard;
    private final TempleMapper templeMapper;
    private final NotificationEventPublisher notificationPublisher;
    private final UserRepository userRepository;

    // ─── Dashboard aggregation ───────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TaDashboardResponse getDashboard(ScopeHelper.Claims claims) {
        Long templeId = claims.templeId();
        ownershipGuard.assertOwnsTemple(templeId);

        Temple temple = findTempleOrThrow(templeId);
        Optional<TempleProfileStaging> latestStaging =
                stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(templeId);

        String profileStatus = deriveProfileStatus(latestStaging, currentRepository.existsByTempleId(templeId));
        List<String> pendingActions = computePendingActions(latestStaging, currentRepository.existsByTempleId(templeId));

        return TaDashboardResponse.builder()
                .temple(TaDashboardResponse.TempleBasicInfo.builder()
                        .id(temple.getId())
                        .name(temple.getName())
                        .registrationNumber(temple.getRegistrationNumber())
                        .grade(temple.getGrade() != null ? temple.getGrade().name() : null)
                        .status(temple.getStatus() != null ? temple.getStatus().name() : null)
                        .build())
                .profileStatus(profileStatus)
                .lastUpdated(latestStaging.map(s -> s.getUpdatedAt()).orElse(null))
                .pendingActions(pendingActions)
                .build();
    }

    // ─── Temple master ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TempleResponse getTemple(ScopeHelper.Claims claims) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        Temple temple = findTempleOrThrow(claims.templeId());
        return templeMapper.toTempleResponse(temple);
    }

    // ─── Current approved profile ─────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TaCurrentProfileResponse getCurrentProfile(ScopeHelper.Claims claims) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        return currentRepository.findByTempleId(claims.templeId())
                .map(this::toCurrentProfileResponse)
                .orElse(null);
    }

    // ─── Staging profile ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TempleProfileStagingResponse getActiveStagingProfile(ScopeHelper.Claims claims) {
        // ownershipGuard is enforced inside stagingService
        return stagingService.getActiveStagingOrNull(claims.templeId());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TempleProfileStagingResponse createOrUpdateStagingProfile(ScopeHelper.Claims claims,
                                                                      TaProfileStagingRequest request) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        CreateTempleProfileStagingRequest mapped = mapToStagingRequest(request);
        TempleProfileStagingResponse response = stagingService.createOrUpdateDraft(claims.templeId(), mapped);
        auditService.logDataEvent(claims.userId(), claims.role(),
                "UPDATE", "TEMPLE_PROFILE_STAGING", response.getId(),
                "TA updated profile staging draft for temple=" + claims.templeId());
        log.info("TA profile staging saved: stagingId=[{}] userId=[{}] templeId=[{}]",
                response.getId(), claims.userId(), claims.templeId());
        return response;
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TempleProfileStagingResponse submitProfile(ScopeHelper.Claims claims) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        Temple temple = findTempleOrThrow(claims.templeId());

        TempleProfileStagingResponse response = stagingService.submitForReview(claims.templeId());

        auditService.logDataEvent(claims.userId(), claims.role(),
                "UPDATE", "TEMPLE_PROFILE_STAGING", response.getId(),
                "TA submitted profile for DC review: temple=" + claims.templeId());

        // Notify all DCs and DC Staff in the temple's district
        userRepository.findAllByRoleAndDistrictId(UserRole.DISTRICT_COLLECTOR, temple.getDistrictId())
                .forEach(dc -> notificationPublisher.publish(dc.getId(), "PROFILE_SUBMITTED",
                        temple.getId(), "TEMPLE_PROFILE"));

        userRepository.findAllByRoleAndDistrictId(UserRole.DC_STAFF, temple.getDistrictId())
                .forEach(staff -> notificationPublisher.publish(staff.getId(), "PROFILE_SUBMITTED",
                        temple.getId(), "TEMPLE_PROFILE"));

        log.info("TA profile submitted for review: stagingId=[{}] userId=[{}] templeId=[{}]",
                response.getId(), claims.userId(), claims.templeId());
        return response;
    }

    // ─── Profile status ────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TaProfileStatusResponse getProfileStatus(ScopeHelper.Claims claims) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        Optional<TempleProfileStaging> latest =
                stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(claims.templeId());

        if (latest.isEmpty()) {
            return TaProfileStatusResponse.builder().status("NOT_CREATED").build();
        }

        TempleProfileStaging s = latest.get();
        // DECISION-01: PENDING_REVIEW is displayed as SUBMITTED
        String statusLabel = s.getStatus() == TempleProfileStagingStatus.PENDING_REVIEW
                ? "SUBMITTED"
                : s.getStatus().name();

        return TaProfileStatusResponse.builder()
                .status(statusLabel)
                .submittedAt(s.getSubmittedAt())
                .reviewComment(s.getReviewComment())
                .build();
    }

    // ─── Document registration ────────────────────────────────────────────────

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TaDocumentResponse registerDocument(ScopeHelper.Claims claims, TaDocumentMetadataRequest request) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        DocumentResponse doc = documentService.registerExternalUpload(
                "TEMPLE",
                claims.templeId(),
                request.getDocumentLabel(),
                request.getS3Key(),
                request.getMimeType(),
                request.getFileSizeBytes(),
                request.getOriginalFilename());
        auditService.logDataEvent(claims.userId(), claims.role(),
                "CREATE", "DOCUMENT", doc.getId(),
                "TA registered document for temple=" + claims.templeId() + " label=" + request.getDocumentLabel());
        log.info("TA document registered: docId=[{}] userId=[{}] templeId=[{}]",
                doc.getId(), claims.userId(), claims.templeId());
        return TaDocumentResponse.builder()
                .id(doc.getId())
                .documentLabel(doc.getDocumentLabel())
                .originalFilename(doc.getOriginalFilename())
                .mimeType(doc.getMimeType())
                .fileSizeBytes(doc.getFileSizeBytes())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    // ─── Activity summary ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.TEMPLE_AUTHORITY_ONLY)
    public TaActivityResponse getActivitySummary(ScopeHelper.Claims claims) {
        ownershipGuard.assertOwnsTemple(claims.templeId());
        Optional<TempleProfileStaging> latest =
                stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(claims.templeId());

        if (latest.isEmpty()) {
            return TaActivityResponse.builder().build();
        }

        TempleProfileStaging s = latest.get();
        String lastReviewAction = null;
        if (s.getReviewedAt() != null) {
            // Map status to a human-readable review action
            lastReviewAction = (s.getStatus() == TempleProfileStagingStatus.APPROVED
                    || s.getStatus() == TempleProfileStagingStatus.SUPERSEDED)
                    ? "APPROVED" : "REJECTED";
        }

        return TaActivityResponse.builder()
                .lastProfileUpdate(s.getUpdatedAt())
                .lastSubmission(s.getSubmittedAt())
                .lastReviewedAt(s.getReviewedAt())
                .lastReviewAction(lastReviewAction)
                .build();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private Temple findTempleOrThrow(Long templeId) {
        return templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
    }

    /**
     * Derives the dashboard profileStatus string from the latest staging record and
     * whether an approved profile already exists.
     */
    private String deriveProfileStatus(Optional<TempleProfileStaging> latestStaging, boolean hasApprovedProfile) {
        if (latestStaging.isEmpty()) {
            return hasApprovedProfile ? "APPROVED" : "NOT_CREATED";
        }
        TempleProfileStaging s = latestStaging.get();
        return switch (s.getStatus()) {
            case DRAFT        -> "DRAFT";
            case PENDING_REVIEW -> "SUBMITTED";   // DECISION-01
            case APPROVED, SUPERSEDED -> "APPROVED";
            case REJECTED     -> "REJECTED";
        };
    }

    /**
     * Derives the list of actionable items shown in the dashboard pending-actions panel.
     */
    private List<String> computePendingActions(Optional<TempleProfileStaging> latestStaging, boolean hasApprovedProfile) {
        List<String> actions = new ArrayList<>();
        if (latestStaging.isEmpty()) {
            if (!hasApprovedProfile) {
                actions.add("Complete and submit your temple profile");
            }
            return actions;
        }
        TempleProfileStaging s = latestStaging.get();
        switch (s.getStatus()) {
            case REJECTED -> actions.add("Resubmit rejected profile changes");
            case DRAFT    -> {
                if (!hasApprovedProfile) actions.add("Submit profile for DC approval");
                else actions.add("Submit pending profile update for DC review");
            }
            default -> { /* PENDING_REVIEW / APPROVED / SUPERSEDED — no action needed */ }
        }
        return actions;
    }

    /**
     * Maps TaProfileStagingRequest → CreateTempleProfileStagingRequest.
     * Keeps TA-specific contract decoupled from the shared staging request.
     */
    private CreateTempleProfileStagingRequest mapToStagingRequest(TaProfileStagingRequest req) {
        return CreateTempleProfileStagingRequest.builder()
                .phone(req.getPhone())
                .email(req.getEmail())
                .website(req.getWebsite())
                .contactPersonName(req.getContactPersonName())
                .contactPersonDesignation(req.getContactPersonDesignation())
                .photoFilePath(req.getPhotoFilePath())
                .bankAccountNumber(req.getBankAccountNumber())
                .bankName(req.getBankName())
                .bankIfsc(req.getBankIfsc())
                .languagesOfWorship(req.getLanguagesOfWorship())
                .linkedInstitutions(req.getLinkedInstitutions())
                .description(req.getDescription())
                .annualFestivals(req.getAnnualFestivals())
                .landmark(req.getLandmark())
                .historicalSignificance(req.getHistoricalSignificance())
                .build();
    }

    /**
     * Maps TempleProfileCurrent → TaCurrentProfileResponse.
     * Bank account decrypted by JPA AttributeConverter; masked to last 4 per VAL-008.
     */
    private TaCurrentProfileResponse toCurrentProfileResponse(TempleProfileCurrent c) {
        String masked = null;
        if (c.getBankAccountNumberEncrypted() != null
                && c.getBankAccountNumberEncrypted().length() >= 4) {
            String plain = c.getBankAccountNumberEncrypted(); // decrypted by @Convert
            masked = "****" + plain.substring(plain.length() - 4);
        }
        return TaCurrentProfileResponse.builder()
                .id(c.getId())
                .templeId(c.getTempleId())
                .phone(c.getPhone())
                .email(c.getEmail())
                .website(c.getWebsite())
                .contactPersonName(c.getContactPersonName())
                .contactPersonDesignation(c.getContactPersonDesignation())
                .photoFilePath(c.getPhotoFilePath())
                .bankAccountMasked(masked)
                .bankName(c.getBankName())
                .bankIfsc(c.getBankIfsc())
                .languagesOfWorship(c.getLanguagesOfWorship())
                .linkedInstitutions(c.getLinkedInstitutions())
                .description(c.getDescription())
                .annualFestivals(c.getAnnualFestivals())
                .landmark(c.getLandmark())
                .historicalSignificance(c.getHistoricalSignificance())
                .publishedAt(c.getPublishedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
