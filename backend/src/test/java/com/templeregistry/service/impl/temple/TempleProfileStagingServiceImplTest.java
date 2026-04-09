package com.templeregistry.service.impl.temple;

import com.templeregistry.dto.request.temple.CreateTempleProfileStagingRequest;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.temple.TempleProfileStagingStatus;
import com.templeregistry.entity.temple.TempleStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.service.notification.NotificationService;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TempleProfileStagingServiceImplTest {

    @Mock TempleProfileStagingRepository stagingRepository;
    @Mock TempleRepository templeRepository;
    @Mock TempleSearchSummaryService summaryService;
    @Mock NotificationService notificationService;
    @Mock OwnershipGuard ownershipGuard;
    @Mock PaginationUtil paginationUtil;

    @InjectMocks TempleProfileStagingServiceImpl stagingService;

    private Temple activeTemple;
    private Temple suspendedTemple;

    @BeforeEach
    void setUp() {
        activeTemple = Temple.builder().status(TempleStatus.ACTIVE).build();
        suspendedTemple = Temple.builder().status(TempleStatus.SUSPENDED).build();

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(any());

        // Mock security context for currentUserId() — lenient because not all tests reach this
        SecurityContext ctx = mock(SecurityContext.class);
        Authentication auth = mock(Authentication.class);
        var claims = mock(com.templeregistry.security.ScopeHelper.Claims.class);
        lenient().when(ctx.getAuthentication()).thenReturn(auth);
        lenient().when(auth.getPrincipal()).thenReturn(claims);
        lenient().when(claims.userId()).thenReturn(42L);
        SecurityContextHolder.setContext(ctx);
    }

    /* ── Suspension guard ──────────────────────────────────────────── */

    @Test
    void should_throw_when_createOrUpdateDraft_called_on_SUSPENDED_temple() {
        when(templeRepository.findById(1L)).thenReturn(Optional.of(suspendedTemple));

        assertThatThrownBy(() -> stagingService.createOrUpdateDraft(1L, new CreateTempleProfileStagingRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUSPENDED");
    }

    @Test
    void should_throw_when_submitForReview_called_on_SUSPENDED_temple() {
        when(templeRepository.findById(1L)).thenReturn(Optional.of(suspendedTemple));

        assertThatThrownBy(() -> stagingService.submitForReview(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUSPENDED");
    }

    /* ── EC-04: Editing locked when PENDING_REVIEW record exists ─────── */

    @Test
    void should_throw_when_PENDING_REVIEW_staging_exists_on_createOrUpdateDraft() {
        when(templeRepository.findById(2L)).thenReturn(Optional.of(activeTemple));
        TempleProfileStaging pending = TempleProfileStaging.builder()
                .templeId(2L).status(TempleProfileStagingStatus.PENDING_REVIEW).build();
        when(stagingRepository.findFirstByTempleIdAndStatus(2L, TempleProfileStagingStatus.PENDING_REVIEW))
                .thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> stagingService.createOrUpdateDraft(2L, new CreateTempleProfileStagingRequest()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("SUBMITTED");
    }

    /* ── DRAFT → PENDING_REVIEW transition ──────────────────────────── */

    @Test
    void should_set_status_to_PENDING_REVIEW_and_submittedAt_when_submitForReview() {
        when(templeRepository.findById(3L)).thenReturn(Optional.of(activeTemple));
        TempleProfileStaging draft = TempleProfileStaging.builder()
                .templeId(3L).versionNumber(1).status(TempleProfileStagingStatus.DRAFT).build();
        when(stagingRepository.findFirstByTempleIdAndStatus(3L, TempleProfileStagingStatus.DRAFT))
                .thenReturn(Optional.of(draft));
        when(stagingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stagingService.submitForReview(3L);

        assertThat(draft.getStatus()).isEqualTo(TempleProfileStagingStatus.PENDING_REVIEW);
        assertThat(draft.getSubmittedAt()).isNotNull();
        assertThat(draft.getSubmittedBy()).isEqualTo(42L);
        verify(notificationService).notify(isNull(), any(), any(), any(), any());
    }

    @Test
    void should_throw_when_no_DRAFT_exists_on_submitForReview() {
        when(templeRepository.findById(3L)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findFirstByTempleIdAndStatus(3L, TempleProfileStagingStatus.DRAFT))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> stagingService.submitForReview(3L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    /* ── PENDING_REVIEW → APPROVED ──────────────────────────────────── */

    @Test
    void should_approve_staging_and_supersede_previous_APPROVED_record() {
        TempleProfileStaging pendingStaging = TempleProfileStaging.builder()
                .templeId(4L).versionNumber(2).status(TempleProfileStagingStatus.PENDING_REVIEW)
                .submittedBy(10L).build();
        TempleProfileStaging previousApproved = TempleProfileStaging.builder()
                .templeId(4L).versionNumber(1).status(TempleProfileStagingStatus.APPROVED).build();

        when(stagingRepository.findById(100L)).thenReturn(Optional.of(pendingStaging));
        when(templeRepository.findById(4L)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findFirstByTempleIdAndStatus(4L, TempleProfileStagingStatus.APPROVED))
                .thenReturn(Optional.of(previousApproved));
        when(stagingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(templeRepository.save(any())).thenReturn(activeTemple);

        stagingService.approve(4L, 100L);

        assertThat(previousApproved.getStatus()).isEqualTo(TempleProfileStagingStatus.SUPERSEDED);
        assertThat(pendingStaging.getStatus()).isEqualTo(TempleProfileStagingStatus.APPROVED);
        assertThat(pendingStaging.getReviewedBy()).isEqualTo(42L);
        verify(summaryService).refresh(4L);
        verify(notificationService).notify(eq(10L), any(), any(), any(), any());
    }

    @Test
    void should_throw_when_approving_a_non_PENDING_REVIEW_staging() {
        TempleProfileStaging rejected = TempleProfileStaging.builder()
                .templeId(4L).status(TempleProfileStagingStatus.REJECTED).build();
        when(stagingRepository.findById(200L)).thenReturn(Optional.of(rejected));

        assertThatThrownBy(() -> stagingService.approve(4L, 200L))
                .isInstanceOf(IllegalStateException.class);
    }

    /* ── PENDING_REVIEW → REJECTED ──────────────────────────────────── */

    @Test
    void should_reject_staging_and_set_reviewComment_and_notify_TA() {
        TempleProfileStaging pendingStaging = TempleProfileStaging.builder()
                .templeId(5L).versionNumber(1).status(TempleProfileStagingStatus.PENDING_REVIEW)
                .submittedBy(20L).build();
        when(stagingRepository.findById(300L)).thenReturn(Optional.of(pendingStaging));
        when(stagingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        stagingService.reject(5L, 300L, "Missing account details.");

        assertThat(pendingStaging.getStatus()).isEqualTo(TempleProfileStagingStatus.REJECTED);
        assertThat(pendingStaging.getReviewComment()).isEqualTo("Missing account details.");
        assertThat(pendingStaging.getReviewedBy()).isEqualTo(42L);
        verify(notificationService).notify(eq(20L), any(), contains("Missing account details."), any(), any());
    }

    @Test
    void should_throw_when_rejecting_a_non_PENDING_REVIEW_staging() {
        TempleProfileStaging draft = TempleProfileStaging.builder()
                .templeId(5L).status(TempleProfileStagingStatus.DRAFT).build();
        when(stagingRepository.findById(400L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> stagingService.reject(5L, 400L, "Reason"))
                .isInstanceOf(IllegalStateException.class);
    }

    /* ── createOrUpdateDraft — creates new DRAFT when none exists ───── */

    @Test
    void should_create_new_DRAFT_when_no_existing_draft() {
        when(templeRepository.findById(6L)).thenReturn(Optional.of(activeTemple));
        when(stagingRepository.findFirstByTempleIdAndStatus(6L, TempleProfileStagingStatus.PENDING_REVIEW))
                .thenReturn(Optional.empty());
        when(stagingRepository.findFirstByTempleIdAndStatus(6L, TempleProfileStagingStatus.DRAFT))
                .thenReturn(Optional.empty());
        when(stagingRepository.findTopByTempleIdOrderByVersionNumberDesc(6L)).thenReturn(Optional.empty());
        TempleProfileStaging newDraft = TempleProfileStaging.builder()
                .templeId(6L).versionNumber(1).status(TempleProfileStagingStatus.DRAFT).build();
        when(stagingRepository.save(any())).thenReturn(newDraft);

        var result = stagingService.createOrUpdateDraft(6L, CreateTempleProfileStagingRequest.builder()
                .contactPersonName("Arjuna Sharma").build());

        assertThat(result).isNotNull();
        verify(stagingRepository).save(any(TempleProfileStaging.class));
    }
}
