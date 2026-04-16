package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.mapper.trust.TrustMapper;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.OwnershipGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrustServiceImplTest {

    @Mock private TrustRepository trustRepository;
    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private TrustMapper trustMapper;
    @Mock private OwnershipGuard ownershipGuard;

    @InjectMocks private TrustServiceImpl trustService;

    private Trust activeTrust;
    private BoardMember currentMember;

    @BeforeEach
    void setUp() {
        activeTrust = Trust.builder()
                .templeId(1L)
                .trustName("Sri Rama Trust")
                .status(TrustStatus.ACTIVE)
                .trustPANNumber("ABCDE1234F")
                .build();
        activeTrust.setId(100L);

        currentMember = BoardMember.builder()
                .trustId(100L)
                .fullName("Govinda Rao")
                .isCurrent(true)
                .build();
        currentMember.setId(200L);
    }

    @Test
    void submitForReview_should_reset_flags_for_trust_and_members() {
        activeTrust.setVerifiedByDc(true);
        activeTrust.setDcFlagReason("Old reason");

        BoardMember m1 = new BoardMember();
        m1.setCurrent(true);
        m1.setVerifiedByDc(true);
        m1.setDcFlagReason("Flagged");

        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.findAllByTrustIdAndIsCurrent(100L, true)).thenReturn(List.of(m1));
        when(trustRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        trustService.submitForReview(100L);

        assertThat(activeTrust.isVerifiedByDc()).isFalse();
        assertThat(activeTrust.getDcFlagReason()).isNull();
        assertThat(m1.isVerifiedByDc()).isFalse();
        assertThat(m1.getDcFlagReason()).isNull();

        verify(boardMemberRepository).saveAll(List.of(m1));
        verify(trustRepository).save(activeTrust);
    }

    @Test
    void should_add_new_member_as_current() {
        CreateBoardMemberRequest req = new CreateBoardMemberRequest();
        req.setFullName("Test Member");
        req.setAadhaar("123456789012");
        req.setDesignation("Chairman");
        req.setAppointmentDate(LocalDate.now());
        req.setContactNumber("9999999999");
        req.setAddress("Temple Street");

        BoardMember entity = new BoardMember();
        entity.setId(10L);
        entity.setCurrent(true);

        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(trustMapper.fromCreateMemberRequest(req)).thenReturn(entity);
        when(boardMemberRepository.save(any())).thenReturn(entity);
        when(trustMapper.toMemberResponse(any())).thenReturn(new BoardMemberResponse());

        trustService.addBoardMember(100L, req);
        assertThat(entity.isCurrent()).isTrue();
    }

    @Test
    void should_auto_transition_to_past_when_tenure_ends() {
        BoardMember member = new BoardMember();
        member.setId(10L);
        member.setTrustId(100L);
        member.setCurrent(true);
        member.setTenureEndDate(LocalDate.now().minusDays(1));

        Page<BoardMember> page = new PageImpl<>(Collections.singletonList(member));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.findAllByTrustId(eq(100L), any(PageRequest.class))).thenReturn(page);
        when(trustMapper.toMemberResponse(any())).thenReturn(null);

        trustService.getBoardMembersByTrust(100L, 0, 10);
        assertThat(member.isCurrent()).isFalse();
    }

    @Test
    void should_not_auto_transition_when_tenure_ends_today() {
        BoardMember member = new BoardMember();
        member.setId(10L);
        member.setTrustId(100L);
        member.setCurrent(true);
        member.setTenureEndDate(LocalDate.now()); // same-day

        Page<BoardMember> page = new PageImpl<>(Collections.singletonList(member));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.findAllByTrustId(eq(100L), any(PageRequest.class))).thenReturn(page);
        when(trustMapper.toMemberResponse(any())).thenReturn(null);

        trustService.getBoardMembersByTrust(100L, 0, 10);
        assertThat(member.isCurrent()).isTrue(); // Should remain true
    }

    @Test
    void should_not_auto_transition_when_tenure_end_is_null() {
        BoardMember member = new BoardMember();
        member.setId(10L);
        member.setTrustId(100L);
        member.setCurrent(true);
        member.setTenureEndDate(null);

        Page<BoardMember> page = new PageImpl<>(Collections.singletonList(member));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.findAllByTrustId(eq(100L), any(PageRequest.class))).thenReturn(page);
        when(trustMapper.toMemberResponse(any())).thenReturn(null);

        trustService.getBoardMembersByTrust(100L, 0, 10);
        assertThat(member.isCurrent()).isTrue();
    }

    @Test
    void should_not_auto_transition_when_tenure_ends_in_future() {
        BoardMember member = new BoardMember();
        member.setId(10L);
        member.setTrustId(100L);
        member.setCurrent(true);
        member.setTenureEndDate(LocalDate.now().plusDays(1));

        Page<BoardMember> page = new PageImpl<>(Collections.singletonList(member));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.findAllByTrustId(eq(100L), any(PageRequest.class))).thenReturn(page);
        when(trustMapper.toMemberResponse(any())).thenReturn(null);

        trustService.getBoardMembersByTrust(100L, 0, 10);
        assertThat(member.isCurrent()).isTrue();
    }

    @Test
    void createTrust_should_fail_if_active_trust_exists() {
        when(trustRepository.existsByTempleIdAndStatus(1L, TrustStatus.ACTIVE)).thenReturn(true);
        CreateTrustRequest request = new CreateTrustRequest();

        assertThatThrownBy(() -> trustService.createTrust(1L, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("ACTIVE trust");
    }

    @Test
    void updateTrust_should_fail_if_trust_dissolved() {
        activeTrust.setStatus(TrustStatus.DISSOLVED);
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        UpdateTrustRequest request = new UpdateTrustRequest();

        assertThatThrownBy(() -> trustService.updateTrust(100L, request))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("TRM-TRUST-001");
    }

    @Test
    void dissolveTrust_should_succeed() {
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(trustRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(trustMapper.toTrustResponse(any())).thenReturn(new TrustResponse());

        DissolveTrustRequest request = new DissolveTrustRequest();
        request.setDissolutionDate(LocalDate.now());
        request.setDissolutionReason("Merged");

        TrustResponse response = trustService.dissolveTrust(100L, request);

        assertThat(activeTrust.getStatus()).isEqualTo(TrustStatus.DISSOLVED);
        verify(trustRepository).save(activeTrust);
    }

    @Test
    void addBoardMember_should_fail_if_trust_dissolved() {
        activeTrust.setStatus(TrustStatus.DISSOLVED);
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        CreateBoardMemberRequest request = new CreateBoardMemberRequest();

        assertThatThrownBy(() -> trustService.addBoardMember(100L, request))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("TRM-TRUST-001");
    }

    @Test
    void resignBoardMember_should_succeed() {
        when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(currentMember));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        when(boardMemberRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(trustMapper.toMemberResponse(any())).thenReturn(new BoardMemberResponse());

        ResignBoardMemberRequest request = new ResignBoardMemberRequest();
        request.setCessationDate(LocalDate.now());

        BoardMemberResponse response = trustService.resignBoardMember(200L, request);

        assertThat(currentMember.isCurrent()).isFalse();
        assertThat(currentMember.getTenureEndDate()).isNotNull();
        verify(boardMemberRepository).save(currentMember);
    }

    @Test
    void updateBoardMember_should_fail_if_historical() {
        currentMember.setCurrent(false);
        when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(currentMember));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(activeTrust));
        UpdateBoardMemberRequest request = new UpdateBoardMemberRequest();

        assertThatThrownBy(() -> trustService.updateBoardMember(200L, request))
                .isInstanceOf(IllegalStatusTransitionException.class)
                .hasMessageContaining("TRM-BM-001");
    }
}
