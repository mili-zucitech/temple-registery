package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.dto.response.trust.TrustResponse;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.trust.TrustStatus;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.IllegalStatusTransitionException;
import com.templeregistry.mapper.trust.TrustMapper;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.trust.TrustService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrustServiceImpl implements TrustService {

    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TrustMapper trustMapper;
    private final OwnershipGuard ownershipGuard;

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public TrustResponse createTrust(Long templeId, CreateTrustRequest request) {
        ownershipGuard.assertOwnsTemple(templeId);

        if (trustRepository.existsByTempleIdAndStatus(templeId, TrustStatus.ACTIVE)) {
            throw new DuplicateResourceException("Temple already has an ACTIVE trust. Dissolve the current one first.");
        }

        if (trustRepository.existsByTrustRegistrationNumberAndStatus(request.getTrustRegistrationNumber(), TrustStatus.ACTIVE)) {
            throw new DuplicateResourceException("Active trust with registration number [" + request.getTrustRegistrationNumber() + "] already exists.");
        }

        Trust trust = trustMapper.fromCreateRequest(request);
        trust.setTempleId(templeId);
        trust.setStatus(TrustStatus.ACTIVE);

        Trust saved = trustRepository.save(trust);
        log.info("Created trust: id=[{}], templeId=[{}]", saved.getId(), templeId);
        return trustMapper.toTrustResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TrustResponse> getTrustsByTemple(Long templeId) {
        ownershipGuard.assertOwnsTemple(templeId);
        return trustRepository.findAllByTempleId(templeId).stream()
                .map(trustMapper::toTrustResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public TrustResponse updateTrust(Long id, UpdateTrustRequest request) {
        Trust trust = findTrustOrThrow(id);
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (trust.getStatus() == TrustStatus.DISSOLVED) {
            throw new IllegalStatusTransitionException("TRM-TRUST-001: Cannot edit a DISSOLVED trust.");
        }

        trustMapper.updateFromRequest(request, trust);
        Trust updated = trustRepository.save(trust);
        log.info("Updated trust: id=[{}]", updated.getId());
        return trustMapper.toTrustResponse(updated);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public TrustResponse dissolveTrust(Long id, DissolveTrustRequest request) {
        Trust trust = findTrustOrThrow(id);
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (trust.getStatus() == TrustStatus.DISSOLVED) {
            throw new IllegalStatusTransitionException("Trust is already dissolved.");
        }

        trust.setStatus(TrustStatus.DISSOLVED);
        trust.setDissolutionDate(request.getDissolutionDate());
        trust.setDissolutionReason(request.getDissolutionReason());

        Trust saved = trustRepository.save(trust);
        log.info("Dissolved trust: id=[{}]", saved.getId());
        return trustMapper.toTrustResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public TrustResponse submitForReview(Long id) {
        Trust trust = findTrustOrThrow(id);
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (trust.getStatus() == TrustStatus.DISSOLVED) {
            throw new IllegalStatusTransitionException("TRM-TRUST-001: Cannot submit a DISSOLVED trust for review.");
        }

        // Reset verification flags for DC review
        trust.setVerifiedByDc(false);
        trust.setDcFlagReason(null);
        
        // Also reset for all current board members
        List<BoardMember> members = boardMemberRepository.findAllByTrustIdAndIsCurrent(id, true);
        for (BoardMember member : members) {
            member.setVerifiedByDc(false);
            member.setDcFlagReason(null);
        }
        boardMemberRepository.saveAll(members);

        Trust saved = trustRepository.save(trust);
        log.info("Submitted trust for DC review: id=[{}]", saved.getId());
        return trustMapper.toTrustResponse(saved);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest request) {
        Trust trust = findTrustOrThrow(trustId);
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (trust.getStatus() == TrustStatus.DISSOLVED) {
            throw new IllegalStatusTransitionException("TRM-TRUST-001: Cannot add members to a DISSOLVED trust.");
        }

        BoardMember member = trustMapper.fromCreateMemberRequest(request);
        member.setTrustId(trustId);
        member.setCurrent(true); // Always mark as current on creation

        BoardMember saved = boardMemberRepository.save(member);
        log.info("Added board member: id=[{}], trustId=[{}]", saved.getId(), trustId);
        return trustMapper.toMemberResponse(saved);
    }

        @Override
        @Transactional(readOnly = true)
        @PreAuthorize("isAuthenticated()")
        public com.templeregistry.common.PaginatedResponse<BoardMemberResponse> getBoardMembersByTrust(Long trustId, int page, int size) {
            Trust trust = findTrustOrThrow(trustId);
            ownershipGuard.assertOwnsTemple(trust.getTempleId());
            org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("appointmentDate").descending());
            org.springframework.data.domain.Page<BoardMember> paged = boardMemberRepository.findAllByTrustId(trustId, pageable);
            // Auto-transition members whose tenureEndDate has passed
        java.time.LocalDate today = java.time.LocalDate.now();
        paged.forEach(member -> {
            if (member.isCurrent() && member.getTenureEndDate() != null && member.getTenureEndDate().isBefore(today)) {
                try {
                    member.setCurrent(false);
                    boardMemberRepository.save(member);
                    log.info("Auto-transitioned board member to historical: id=[{}], trustId=[{}], tenureEndDate=[{}]", 
                            member.getId(), member.getTrustId(), member.getTenureEndDate());
                } catch (Exception e) {
                    log.error("Failed to auto-transition board member to historical: id=[{}], trustId=[{}]", 
                            member.getId(), member.getTrustId(), e);
                }
            }
        });
            org.springframework.data.domain.Page<BoardMemberResponse> mapped = paged.map(trustMapper::toMemberResponse);
            return com.templeregistry.common.PaginatedResponse.of(mapped);
        }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public BoardMemberResponse updateBoardMember(Long id, UpdateBoardMemberRequest request) {
        BoardMember member = findMemberOrThrow(id);
        Trust trust = findTrustOrThrow(member.getTrustId());
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (!member.isCurrent()) {
            throw new IllegalStatusTransitionException("TRM-BM-001: Cannot edit a historical member.");
        }

        trustMapper.updateMemberFromRequest(request, member);
        BoardMember updated = boardMemberRepository.save(member);
        log.info("Updated board member: id=[{}]", updated.getId());
        return trustMapper.toMemberResponse(updated);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public BoardMemberResponse resignBoardMember(Long id, ResignBoardMemberRequest request) {
        BoardMember member = findMemberOrThrow(id);
        Trust trust = findTrustOrThrow(member.getTrustId());
        ownershipGuard.assertOwnsTemple(trust.getTempleId());

        if (!member.isCurrent()) {
            throw new IllegalStatusTransitionException("TRM-BM-001: Member is already historical.");
        }

        member.setCurrent(false);
        member.setTenureEndDate(request.getCessationDate());

        BoardMember saved = boardMemberRepository.save(member);
        log.info("Member resigned: id=[{}]", saved.getId());
        return trustMapper.toMemberResponse(saved);
    }

    private Trust findTrustOrThrow(Long id) {
        return trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust not registered.", "TRUST_NOT_FOUND"));
    }

    private BoardMember findMemberOrThrow(Long id) {
        return boardMemberRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", id));
    }
}
