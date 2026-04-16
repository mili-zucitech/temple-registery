package com.templeregistry.service.impl.dc;

import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.mapper.trust.TrustMapper;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DcTrustWorkflowServiceImplTest {

    @Mock private TrustRepository trustRepository;
    @Mock private BoardMemberRepository boardMemberRepository;
    @Mock private TempleRepository templeRepository;
    @Mock private TrustMapper trustMapper;
    @Mock private JurisdictionGuard jurisdictionGuard;

    @InjectMocks private DcTrustWorkflowServiceImpl dcTrustWorkflowService;

    private Trust trust;
    private BoardMember boardMember;
    private Temple temple;
    private ScopeHelper.Claims dcClaims;

    @BeforeEach
    void setUp() {
        temple = Temple.builder().districtId(10L).build();
        temple.setId(1L);
        trust = Trust.builder().templeId(1L).build();
        trust.setId(100L);
        boardMember = BoardMember.builder().trustId(100L).build();
        boardMember.setId(200L);
        dcClaims = new ScopeHelper.Claims(5L, RoleConstants.DISTRICT_COLLECTOR, 10L, null, "dc_user");
    }

    @Test
    void should_approve_trust() {
        when(trustRepository.findById(100L)).thenReturn(Optional.of(trust));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        when(trustRepository.save(any(Trust.class))).thenAnswer(i -> i.getArgument(0));

        dcTrustWorkflowService.approveTrust(100L, dcClaims);

        assertThat(trust.isVerifiedByDc()).isTrue();
        assertThat(trust.getDcFlagReason()).isNull();
        verify(trustRepository).save(trust);
    }

    @Test
    void should_reject_trust() {
        when(trustRepository.findById(100L)).thenReturn(Optional.of(trust));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        when(trustRepository.save(any(Trust.class))).thenAnswer(i -> i.getArgument(0));

        dcTrustWorkflowService.rejectTrust(100L, "Missing documentation", dcClaims);

        assertThat(trust.isVerifiedByDc()).isFalse();
        assertThat(trust.getDcFlagReason()).isEqualTo("Missing documentation");
        verify(trustRepository).save(trust);
    }

    @Test
    void should_approve_board_member() {
        when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(boardMember));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(trust));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(i -> i.getArgument(0));

        dcTrustWorkflowService.approveBoardMember(200L, dcClaims);

        assertThat(boardMember.isVerifiedByDc()).isTrue();
        assertThat(boardMember.getDcFlagReason()).isNull();
        verify(boardMemberRepository).save(boardMember);
    }

    @Test
    void should_reject_board_member() {
        when(boardMemberRepository.findById(200L)).thenReturn(Optional.of(boardMember));
        when(trustRepository.findById(100L)).thenReturn(Optional.of(trust));
        when(templeRepository.findWithGeoById(1L)).thenReturn(Optional.of(temple));
        doNothing().when(jurisdictionGuard).assertDistrictScope(temple, dcClaims);
        when(boardMemberRepository.save(any(BoardMember.class))).thenAnswer(i -> i.getArgument(0));

        dcTrustWorkflowService.rejectBoardMember(200L, "Invalid Aadhaar", dcClaims);

        assertThat(boardMember.isVerifiedByDc()).isFalse();
        assertThat(boardMember.getDcFlagReason()).isEqualTo("Invalid Aadhaar");
        verify(boardMemberRepository).save(boardMember);
    }
}
