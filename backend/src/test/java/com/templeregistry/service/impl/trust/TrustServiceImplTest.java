package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.CreateBoardMeetingRequest;
import com.templeregistry.dto.request.trust.SubmitTrustFinancialRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.entity.trust.BoardMeeting;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.TrustFinancial;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.trust.BoardMeetingRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrustServiceImplTest {

    @Mock TrustRepository trustRepository;
    @Mock BoardMemberRepository boardMemberRepository;
    @Mock BoardMeetingRepository boardMeetingRepository;
    @Mock TrustFinancialRepository financialRepository;
    @Mock OwnershipGuard ownershipGuard;
    @Mock PaginationUtil paginationUtil;
    @Mock TempleRepository templeRepository;
    @Mock JurisdictionGuard jurisdictionGuard;

    @InjectMocks TrustServiceImpl trustService;

    private Trust trust;
    private BoardMember activeMember;

    @BeforeEach
    void setUp() {
        trust = Trust.builder().templeId(1L).trustName("Sri Rama Trust").build();
        activeMember = BoardMember.builder().trustId(1L).fullName("Govinda Rao").isCurrent(true).build();

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(any());
        when(templeRepository.findById(anyLong())).thenReturn(Optional.of(mock(com.templeregistry.entity.temple.Temple.class)));
        lenient().doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
    }

    /* ── VAL-014: Board member cessation date required ──────────────── */

    @Test
    void should_throw_when_marking_member_not_current_without_tenureEndDate() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        when(boardMemberRepository.findById(1L)).thenReturn(Optional.of(activeMember));

        UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                .isCurrent(false)
                .tenureEndDate(null)
                .build();

        assertThatThrownBy(() -> trustService.updateBoardMember(1L, 1L, rq))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("VAL-014");
    }

    @Test
    void should_update_board_member_with_tenureEndDate_when_marking_not_current() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        when(boardMemberRepository.findById(2L)).thenReturn(Optional.of(activeMember));
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        LocalDate endDate = LocalDate.of(2024, 6, 30);
        UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                .isCurrent(false)
                .tenureEndDate(endDate)
                .build();

        trustService.updateBoardMember(1L, 2L, rq);

        assertThat(activeMember.isCurrent()).isFalse();
        assertThat(activeMember.getTenureEndDate()).isEqualTo(endDate);
    }

    @Test
    void should_allow_update_if_isCurrent_remains_true_without_tenureEndDate() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        when(boardMemberRepository.findById(3L)).thenReturn(Optional.of(activeMember));
        when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                .fullName("Updated Name")
                .isCurrent(true)
                .tenureEndDate(null)
                .build();

        assertThatNoException().isThrownBy(() -> trustService.updateBoardMember(1L, 3L, rq));
    }

    /* ── VAL-013: One financial submission per FY ───────────────────── */

    @Test
    void should_throw_when_financial_already_submitted_for_same_FY() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        TrustFinancial existing = TrustFinancial.builder().trustId(1L).financialYear("2023-24").build();
        when(financialRepository.findAllByTrustIdOrderByFinancialYearDesc(1L))
                .thenReturn(List.of(existing));

        SubmitTrustFinancialRequest rq = mock(SubmitTrustFinancialRequest.class);
        when(rq.getFinancialYear()).thenReturn("2023-24");

        assertThatThrownBy(() -> trustService.submitFinancial(1L, rq))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("VAL-013")
                .hasMessageContaining("2023-24");
    }

    @Test
    void should_save_financial_when_FY_is_new() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        when(financialRepository.findAllByTrustIdOrderByFinancialYearDesc(1L)).thenReturn(List.of());
        when(financialRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SubmitTrustFinancialRequest rq = mock(SubmitTrustFinancialRequest.class);
        when(rq.getFinancialYear()).thenReturn("2024-25");
        when(rq.getAnnualIncome()).thenReturn(java.math.BigDecimal.valueOf(600000));
        when(rq.getAnnualExpenditure()).thenReturn(java.math.BigDecimal.valueOf(400000));

        assertThatNoException().isThrownBy(() -> trustService.submitFinancial(1L, rq));
        verify(financialRepository).save(any(TrustFinancial.class));
    }

    /* ── Board meeting CRUD ─────────────────────────────────────────── */

    @Test
    void should_create_board_meeting_and_return_response() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        BoardMeeting saved = BoardMeeting.builder()
                .trustId(1L).meetingDate(LocalDate.of(2024, 7, 15)).agenda("Annual Review").build();
        when(boardMeetingRepository.save(any())).thenReturn(saved);

        CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                .meetingDate(LocalDate.of(2024, 7, 15))
                .agenda("Annual Review")
                .build();

        var result = trustService.createBoardMeeting(1L, rq);

        assertThat(result).isNotNull();
        assertThat(result.getAgenda()).isEqualTo("Annual Review");
    }

    @Test
    void should_throw_EntityNotFoundException_when_trust_not_found_for_board_meeting() {
        when(trustRepository.findById(99L)).thenReturn(Optional.empty());

        CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                .meetingDate(LocalDate.now()).build();

        assertThatThrownBy(() -> trustService.createBoardMeeting(99L, rq))
                .isInstanceOf(EntityNotFoundException.class);
    }

    /* ── EntityNotFoundException on board member ─────────────────────── */

    @Test
    void should_throw_EntityNotFoundException_when_board_member_not_found() {
        when(trustRepository.findById(1L)).thenReturn(Optional.of(trust));
        when(boardMemberRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder().fullName("Ghost").build();

        assertThatThrownBy(() -> trustService.updateBoardMember(1L, 99L, rq))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
