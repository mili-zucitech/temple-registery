package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.request.dc.FlagTempleProfileRequest;
import com.templeregistry.dto.request.dc.UnflagTempleProfileRequest;
import com.templeregistry.dto.request.dc.VerifyTempleProfileRequest;
import com.templeregistry.dto.response.dc.TempleVerificationResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.VerificationStatus;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.notification.NotificationHelper;
import com.templeregistry.service.temple.TempleSearchSummaryService;
import com.templeregistry.service.workflow.WorkflowEngineAdaptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for DcTempleVerificationServiceImpl.
 *
 * Covers: verify, flag, unflag paths including jurisdiction, notification,
 * and summary refresh side-effects.
 */
@ExtendWith(MockitoExtension.class)
class DcTempleVerificationServiceImplTest {

    @Mock TempleRepository templeRepository;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock TempleSearchSummaryService summaryService;
    @Mock NotificationHelper notificationHelper;
    @Mock WorkflowEngineAdaptor workflowEngineAdaptor;

    @InjectMocks
    DcTempleVerificationServiceImpl service;

    private Temple temple;
    private ScopeHelper.Claims dcClaims;

    @BeforeEach
    void setUp() {
        temple = Temple.builder()
                .districtId(10L)
                .build();
        temple.setId(7L);
        temple.setVerificationStatus(VerificationStatus.UNVERIFIED);

        dcClaims = new ScopeHelper.Claims(5L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc_user");
    }

    // ── verifyTempleProfile ───────────────────────────────────────────────────

    @Test
    void should_setStatusToVerified_when_verifyTempleProfileCalled() {
        when(templeRepository.findWithGeoById(7L)).thenReturn(Optional.of(temple));
        when(templeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TempleVerificationResponse response = service.verifyTempleProfile(
                7L, new VerifyTempleProfileRequest(), dcClaims);

        assertThat(temple.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(temple.getDcRejectionReason()).isNull();
        assertThat(response.getVerificationStatus()).isEqualTo("VERIFIED");
        verify(summaryService).refresh(7L);
        verify(workflowEngineAdaptor).adaptVerifyTempleProfile(7L, 10L, 5L);
        verify(notificationHelper).notifyTempleApproved(7L, 5L);
    }

    @Test
    void should_callAssertDistrictScope_when_verifyTempleProfileCalled() {
        when(templeRepository.findWithGeoById(7L)).thenReturn(Optional.of(temple));
        when(templeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.verifyTempleProfile(7L, new VerifyTempleProfileRequest(), dcClaims);

        verify(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
    }

    @Test
    void should_throwEntityNotFoundException_when_templeNotFoundOnVerify() {
        when(templeRepository.findWithGeoById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyTempleProfile(999L, new VerifyTempleProfileRequest(), dcClaims))
                .isInstanceOf(EntityNotFoundException.class);

        verify(templeRepository, never()).save(any());
        verifyNoInteractions(summaryService, notificationHelper);
    }

    // ── flagTempleProfile ─────────────────────────────────────────────────────

    @Test
    void should_setStatusToFlagged_and_setRejectionReason_when_flagTempleProfileCalled() {
        when(templeRepository.findWithGeoById(7L)).thenReturn(Optional.of(temple));
        when(templeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        FlagTempleProfileRequest req = new FlagTempleProfileRequest();
        setField(req, "reason", "Missing land survey documents.");

        TempleVerificationResponse response = service.flagTempleProfile(7L, req, dcClaims);

        assertThat(temple.getVerificationStatus()).isEqualTo(VerificationStatus.FLAGGED);
        assertThat(temple.getDcRejectionReason()).isEqualTo("Missing land survey documents.");
        assertThat(response.getVerificationStatus()).isEqualTo("FLAGGED");
        verify(summaryService).refresh(7L);
        verify(workflowEngineAdaptor).adaptFlagTempleProfile(7L, 10L, 5L, "Missing land survey documents.");
        verify(notificationHelper).notifyTempleFlagged(7L, 5L, "Missing land survey documents.");
    }

    // ── unflagTempleProfile ───────────────────────────────────────────────────

    @Test
    void should_setStatusToUnverified_and_clearReason_when_unflagTempleProfileCalled() {
        temple.setVerificationStatus(VerificationStatus.FLAGGED);
        temple.setDcRejectionReason("Missing documents.");
        when(templeRepository.findWithGeoById(7L)).thenReturn(Optional.of(temple));
        when(templeRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        TempleVerificationResponse response = service.unflagTempleProfile(
                7L, new UnflagTempleProfileRequest(), dcClaims);

        assertThat(temple.getVerificationStatus()).isEqualTo(VerificationStatus.UNVERIFIED);
        assertThat(temple.getDcRejectionReason()).isNull();
        assertThat(response.getVerificationStatus()).isEqualTo("UNVERIFIED");
        verify(summaryService).refresh(7L);
        verify(workflowEngineAdaptor).adaptUnflagTempleProfile(7L, 10L, 5L);
        verify(notificationHelper).notifyTempleUnflagged(7L, 5L);
    }

    @Test
    void should_throwIllegalStateException_when_unflagCalledOnNonFlaggedTemple() {
        temple.setVerificationStatus(VerificationStatus.UNVERIFIED);
        when(templeRepository.findWithGeoById(7L)).thenReturn(Optional.of(temple));

        assertThatThrownBy(() -> service.unflagTempleProfile(7L, new UnflagTempleProfileRequest(), dcClaims))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not currently flagged");

        verify(templeRepository, never()).save(any());
        verifyNoInteractions(summaryService, notificationHelper);
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static void setField(Object target, String name, Object value) {
        try {
            var field = target.getClass().getDeclaredField(name);
            field.setAccessible(true);
            field.set(target, value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set field: " + name, e);
        }
    }
}
