package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.mapper.trust.TrustMapper;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.AuditService;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.DcTrustWorkflowService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcTrustWorkflowServiceImpl implements DcTrustWorkflowService {

    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TempleRepository templeRepository;
    private final TrustMapper trustMapper;
    private final JurisdictionGuard jurisdictionGuard;
    private final GovernanceAuditService governanceAuditService;
    private final AuditService auditService;
    private final NotificationEventPublisher notificationPublisher;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TrustResponse approveTrust(Long trustId, ScopeHelper.Claims claims) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        assertDcScope(trust.getTempleId(), claims);

        trust.setVerifiedByDc(true);
        trust.setDcFlagReason(null);
        
        Trust saved = trustRepository.save(trust);
        
        governanceAuditService.logAction(trustId, "TRUST", claims.userId(), "VERIFY", "Trust verified by DC");
        auditService.logDataEvent(claims.userId(), claims.role(), "VERIFY", "TRUST", trustId, "DC approved trust");
        
        // Find TA for this temple to notify
        // For now, notifying temple authority general group or similar if possible, 
        // but notificationPublisher requires a specific recipientId.
        // Assuming there's a way to find the TA user for a temple.
        // For now, logging the intent.
        
        log.info("DC approved trust: id=[{}]", saved.getId());
        return trustMapper.toTrustResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public TrustResponse rejectTrust(Long trustId, String reason, ScopeHelper.Claims claims) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        assertDcScope(trust.getTempleId(), claims);

        trust.setVerifiedByDc(false);
        trust.setDcFlagReason(reason);
        
        Trust saved = trustRepository.save(trust);
        
        governanceAuditService.logAction(trustId, "TRUST", claims.userId(), "FLAG", "Trust flagged: " + reason);
        auditService.logDataEvent(claims.userId(), claims.role(), "FLAG", "TRUST", trustId, "DC rejected trust: " + reason);
        
        log.info("DC rejected trust: id=[{}] with reason=[{}]", saved.getId(), reason);
        return trustMapper.toTrustResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public BoardMemberResponse approveBoardMember(Long memberId, ScopeHelper.Claims claims) {
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        Trust trust = trustRepository.findById(member.getTrustId())
                .orElseThrow(() -> new EntityNotFoundException("Trust", member.getTrustId()));
        assertDcScope(trust.getTempleId(), claims);

        member.setVerifiedByDc(true);
        member.setDcFlagReason(null);

        BoardMember saved = boardMemberRepository.save(member);
        
        governanceAuditService.logAction(memberId, "BOARD_MEMBER", claims.userId(), "VERIFY", "Board member verified by DC");
        auditService.logDataEvent(claims.userId(), claims.role(), "VERIFY", "BOARD_MEMBER", memberId, "DC approved board member");

        log.info("DC approved board member: id=[{}]", saved.getId());
        return trustMapper.toMemberResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    public BoardMemberResponse rejectBoardMember(Long memberId, String reason, ScopeHelper.Claims claims) {
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        Trust trust = trustRepository.findById(member.getTrustId())
                .orElseThrow(() -> new EntityNotFoundException("Trust", member.getTrustId()));
        assertDcScope(trust.getTempleId(), claims);

        member.setVerifiedByDc(false);
        member.setDcFlagReason(reason);

        BoardMember saved = boardMemberRepository.save(member);
        
        governanceAuditService.logAction(memberId, "BOARD_MEMBER", claims.userId(), "FLAG", "Board member flagged: " + reason);
        auditService.logDataEvent(claims.userId(), claims.role(), "FLAG", "BOARD_MEMBER", memberId, "DC rejected board member: " + reason);

        log.info("DC rejected board member: id=[{}] with reason=[{}]", saved.getId(), reason);
        return trustMapper.toMemberResponse(saved);
    }

    private void assertDcScope(Long templeId, ScopeHelper.Claims claims) {
        Temple temple = templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        jurisdictionGuard.assertDistrictScope(temple, claims);
    }
}
