package com.templeregistry.service.impl.ta;

import com.templeregistry.dto.request.ta.TaDocumentMetadataRequest;
import com.templeregistry.dto.request.ta.TaProfileStagingRequest;
import com.templeregistry.dto.response.document.DocumentResponse;
import com.templeregistry.dto.response.ta.TaActivityResponse;
import com.templeregistry.dto.response.ta.TaCurrentProfileResponse;
import com.templeregistry.dto.response.ta.TaDashboardResponse;
import com.templeregistry.dto.response.ta.TaDocumentResponse;
import com.templeregistry.dto.response.ta.TaProfileStatusResponse;
import com.templeregistry.dto.response.temple.TempleProfileStagingResponse;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleGrade;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.JurisdictionAccessDeniedException;
import com.templeregistry.mapper.temple.TempleMapper;
import com.templeregistry.repository.auth.UserRepository;
import com.templeregistry.repository.dc.TempleProfileCurrentRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.document.DocumentService;
import com.templeregistry.service.temple.TempleProfileStagingService;
import com.templeregistry.service.workflow.WorkflowEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaDashboardServiceImplTest {

    @Mock TempleRepository templeRepository;
    @Mock TempleProfileStagingRepository stagingRepository;
    @Mock TempleProfileCurrentRepository currentRepository;
    @Mock TempleProfileStagingService stagingService;
    @Mock DocumentService documentService;
    @Mock AuditService auditService;
    @Mock OwnershipGuard ownershipGuard;
    @Mock TempleMapper templeMapper;
    @Mock NotificationEventPublisher notificationPublisher;
    @Mock UserRepository userRepository;
    @Mock WorkflowEngine workflowEngine;

    @InjectMocks TaDashboardServiceImpl taDashboardService;

    private static final Long TEMPLE_ID = 10L;
    private static final Long USER_ID   = 42L;

    private ScopeHelper.Claims claims;
    private Temple activeTemple;

    @BeforeEach
    void setUp() {
        claims = new ScopeHelper.Claims(USER_ID, "TEMPLE_AUTHORITY", null, TEMPLE_ID, "ta_user");
        activeTemple = Temple.builder()
                .status(TempleStatus.ACTIVE)
                .grade(TempleGrade.A)
                .name("Sri Venkateswara Temple")
                .registrationNumber("KA-REG-001")
                .build();
        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(anyLong());
    }

    // ─── Dashboard ─────────────────────────────────────────────────────────────

    @Test
    void should_returnDashboard_when_templeHasApprovedProfile() {
        TempleProfileStaging approvedStaging = TempleProfileStaging.builder()
                .templeId(TEMPLE_ID)
                .status(TempleProfileStagingStatus.APPROVED)
                .build();
        approvedStaging.setId(100L);
        when(templeRepository.findById(TEMPLE_ID)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.of(approvedStaging));
        when(currentRepository.existsByTempleId(TEMPLE_ID)).thenReturn(true);

        TaDashboardResponse result = taDashboardService.getDashboard(claims);

        assertThat(result).isNotNull();
        assertThat(result.getProfileStatus()).isEqualTo("APPROVED");
        assertThat(result.getPendingActions()).isEmpty();
        assertThat(result.getTemple().getName()).isEqualTo("Sri Venkateswara Temple");
    }

    @Test
    void should_returnDashboardWithPendingActions_when_noDraftExists() {
        when(templeRepository.findById(TEMPLE_ID)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.empty());
        when(currentRepository.existsByTempleId(TEMPLE_ID)).thenReturn(false);

        TaDashboardResponse result = taDashboardService.getDashboard(claims);

        assertThat(result.getProfileStatus()).isEqualTo("NOT_CREATED");
        assertThat(result.getPendingActions()).containsExactly("Complete and submit your temple profile");
    }

    // ─── Create / update staging profile ─────────────────────────────────────

    @Test
    void should_createStagingProfile_when_noDraftExistsForTemple() {
        TaProfileStagingRequest request = TaProfileStagingRequest.builder()
                .contactPersonName("Rama Rao")
                .contactPersonDesignation("Executive Officer")
                .build();
        TempleProfileStagingResponse mockResponse = TempleProfileStagingResponse.builder()
                .id(1L).templeId(TEMPLE_ID).versionNumber(1).statusLabel("DRAFT").build();

        when(stagingService.createOrUpdateDraft(eq(TEMPLE_ID), any())).thenReturn(mockResponse);
        doNothing().when(auditService).logDataEvent(anyLong(), anyString(), anyString(), anyString(), anyLong(), anyString());

        TempleProfileStagingResponse result = taDashboardService.createOrUpdateStagingProfile(claims, request);

        assertThat(result).isNotNull();
        assertThat(result.getStatusLabel()).isEqualTo("DRAFT");
        assertThat(result.getVersionNumber()).isEqualTo(1);
        verify(stagingService).createOrUpdateDraft(eq(TEMPLE_ID), any());
        verify(auditService).logDataEvent(eq(USER_ID), eq("TEMPLE_AUTHORITY"), eq("UPDATE"),
                eq("TEMPLE_PROFILE_STAGING"), eq(1L), anyString());
    }

    @Test
    void should_updateStagingProfile_when_draftExists() {
        TaProfileStagingRequest request = TaProfileStagingRequest.builder()
                .phone("9876543210")
                .email("temple@example.com")
                .bankName("State Bank of India")
                .bankIfsc("SBIN0001234")
                .build();
        TempleProfileStagingResponse mockResponse = TempleProfileStagingResponse.builder()
                .id(5L).templeId(TEMPLE_ID).versionNumber(2).statusLabel("DRAFT")
                .phone("9876543210").email("temple@example.com").build();

        when(stagingService.createOrUpdateDraft(eq(TEMPLE_ID), any())).thenReturn(mockResponse);
        doNothing().when(auditService).logDataEvent(anyLong(), anyString(), anyString(), anyString(), anyLong(), anyString());

        TempleProfileStagingResponse result = taDashboardService.createOrUpdateStagingProfile(claims, request);

        assertThat(result.getPhone()).isEqualTo("9876543210");
        assertThat(result.getEmail()).isEqualTo("temple@example.com");
        verify(stagingService, times(1)).createOrUpdateDraft(eq(TEMPLE_ID), any());
    }

    // ─── EC-04: Editing locked during PENDING_REVIEW ──────────────────────────

    @Test
    void should_throwException_when_profileInPendingReviewAndEditAttempted() {
        TaProfileStagingRequest request = TaProfileStagingRequest.builder()
                .contactPersonName("Changed Name")
                .build();

        when(stagingService.createOrUpdateDraft(eq(TEMPLE_ID), any()))
                .thenThrow(new IllegalStateException(
                        "A profile submission is already under DC review (status: SUBMITTED). " +
                        "Editing is locked until DC responds."));

        assertThatThrownBy(() -> taDashboardService.createOrUpdateStagingProfile(claims, request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUBMITTED");
    }

    // ─── Submit profile ────────────────────────────────────────────────────────

    @Test
    void should_submitProfile_when_draftExistsAndRequiredFieldsPresent() {
        TempleProfileStagingResponse submittedResponse = TempleProfileStagingResponse.builder()
                .id(3L).templeId(TEMPLE_ID).versionNumber(1).statusLabel("SUBMITTED")
                .submittedAt(LocalDateTime.now()).build();

        when(stagingService.submitForReview(TEMPLE_ID)).thenReturn(submittedResponse);
        when(templeRepository.findById(TEMPLE_ID)).thenReturn(Optional.of(activeTemple));
        when(userRepository.findAllByRoleAndDistrictId(any(), any())).thenReturn(java.util.List.of());
        doNothing().when(auditService).logDataEvent(anyLong(), anyString(), anyString(), anyString(), anyLong(), anyString());

        TempleProfileStagingResponse result = taDashboardService.submitProfile(claims);

        assertThat(result.getStatusLabel()).isEqualTo("SUBMITTED");
        assertThat(result.getSubmittedAt()).isNotNull();
        verify(stagingService).submitForReview(TEMPLE_ID);
    }

    // ─── Current profile ──────────────────────────────────────────────────────

    @Test
    void should_returnNullCurrentProfile_when_noApprovedProfileExists() {
        when(currentRepository.findByTempleId(TEMPLE_ID)).thenReturn(Optional.empty());

        TaCurrentProfileResponse result = taDashboardService.getCurrentProfile(claims);

        assertThat(result).isNull();
    }

    @Test
    void should_returnCurrentProfile_when_approvedProfileExists() {
        TempleProfileCurrent current = TempleProfileCurrent.builder()
                .id(1L).templeId(TEMPLE_ID)
                .contactPersonName("Rama Rao")
                .contactPersonDesignation("Executive Officer")
                .bankName("SBI")
                .bankAccountNumberEncrypted("12345678")  // treated as decrypted plain text in tests (no live JPA @Convert)
                .publishedAt(LocalDateTime.now())
                .build();
        when(currentRepository.findByTempleId(TEMPLE_ID)).thenReturn(Optional.of(current));

        TaCurrentProfileResponse result = taDashboardService.getCurrentProfile(claims);

        assertThat(result).isNotNull();
        assertThat(result.getContactPersonName()).isEqualTo("Rama Rao");
        assertThat(result.getBankAccountMasked()).isEqualTo("****5678");
        assertThat(result.getBankName()).isEqualTo("SBI");
    }

    // ─── Cross-temple access denial ───────────────────────────────────────────

    @Test
    void should_throwJurisdictionException_when_taAccessesAnotherTemple() {
        doThrow(new JurisdictionAccessDeniedException("Temple ownership mismatch"))
                .when(ownershipGuard).assertOwnsTemple(TEMPLE_ID);

        assertThatThrownBy(() -> taDashboardService.getDashboard(claims))
                .isInstanceOf(JurisdictionAccessDeniedException.class)
                .hasMessageContaining("ownership mismatch");

        verify(templeRepository, never()).findById(anyLong());
    }

    // ─── Document registration ────────────────────────────────────────────────

    @Test
    void should_registerDocument_when_validMetadataProvided() {
        TaDocumentMetadataRequest request = TaDocumentMetadataRequest.builder()
                .s3Key("temple/10/docs/trust-deed.pdf")
                .mimeType("application/pdf")
                .fileSizeBytes(204800L)
                .originalFilename("trust-deed.pdf")
                .documentLabel("Trust Deed")
                .build();
        DocumentResponse docResponse = DocumentResponse.builder()
                .id(7L).ownerType("TEMPLE").ownerId(TEMPLE_ID)
                .documentLabel("Trust Deed").originalFilename("trust-deed.pdf")
                .mimeType("application/pdf").fileSizeBytes(204800L)
                .createdAt(LocalDateTime.now()).build();

        when(documentService.registerExternalUpload(
                eq("TEMPLE"), eq(TEMPLE_ID), eq("Trust Deed"),
                eq("temple/10/docs/trust-deed.pdf"), eq("application/pdf"),
                eq(204800L), eq("trust-deed.pdf"))).thenReturn(docResponse);
        doNothing().when(auditService).logDataEvent(anyLong(), anyString(), anyString(), anyString(), anyLong(), anyString());

        TaDocumentResponse result = taDashboardService.registerDocument(claims, request);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(7L);
        assertThat(result.getDocumentLabel()).isEqualTo("Trust Deed");
        assertThat(result.getMimeType()).isEqualTo("application/pdf");
    }

    // ─── Activity summary ─────────────────────────────────────────────────────

    @Test
    void should_returnEmptyActivity_when_noStagingRecordExists() {
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.empty());

        TaActivityResponse result = taDashboardService.getActivitySummary(claims);

        assertThat(result).isNotNull();
        assertThat(result.getLastProfileUpdate()).isNull();
        assertThat(result.getLastSubmission()).isNull();
        assertThat(result.getLastReviewAction()).isNull();
    }

    @Test
    void should_returnActivity_when_stagingRecordHasBeenReviewed() {
        LocalDateTime now = LocalDateTime.now();
        TempleProfileStaging staging = TempleProfileStaging.builder()
                .templeId(TEMPLE_ID)
                .status(TempleProfileStagingStatus.APPROVED)
                .submittedAt(now.minusDays(2))
                .reviewedAt(now.minusDays(1))
                .build();
        staging.setId(200L);
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.of(staging));

        TaActivityResponse result = taDashboardService.getActivitySummary(claims);

        assertThat(result.getLastSubmission()).isEqualTo(now.minusDays(2));
        assertThat(result.getLastReviewedAt()).isEqualTo(now.minusDays(1));
        assertThat(result.getLastReviewAction()).isEqualTo("APPROVED");
    }

    // ─── Profile status ────────────────────────────────────────────────────────

    @Test
    void should_returnSubmittedStatus_when_stagingIsPendingReview() {
        TempleProfileStaging staging = TempleProfileStaging.builder()
                .templeId(TEMPLE_ID)
                .status(TempleProfileStagingStatus.PENDING_REVIEW)
                .submittedAt(LocalDateTime.now())
                .build();
        staging.setId(300L);
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.of(staging));

        TaProfileStatusResponse result = taDashboardService.getProfileStatus(claims);

        // DECISION-01: PENDING_REVIEW is displayed as SUBMITTED
        assertThat(result.getStatus()).isEqualTo("SUBMITTED");
        assertThat(result.getSubmittedAt()).isNotNull();
        assertThat(result.getReviewComment()).isNull();
    }

    @Test
    void should_includeReviewComment_when_stagingIsRejected() {
        TempleProfileStaging staging = TempleProfileStaging.builder()
                .templeId(TEMPLE_ID)
                .status(TempleProfileStagingStatus.REJECTED)
                .reviewComment("Contact person name is missing")
                .submittedAt(LocalDateTime.now().minusDays(3))
                .build();
        staging.setId(400L);
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(eq(TEMPLE_ID)))
                .thenReturn(Optional.of(staging));

        TaProfileStatusResponse result = taDashboardService.getProfileStatus(claims);

        assertThat(result.getStatus()).isEqualTo("REJECTED");
        assertThat(result.getReviewComment()).isEqualTo("Contact person name is missing");
    }
}
