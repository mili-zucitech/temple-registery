package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.entity.trust.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.trust.*;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.service.trust.TrustService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrustServiceImpl implements TrustService {

    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TrustFinancialRepository financialRepository;
    private final OwnershipGuard ownershipGuard;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TrustResponse> listByTemple(Long templeId) {
        ownershipGuard.assertOwnsTemple(templeId);
        return trustRepository.findAllByTempleId(templeId).stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TrustResponse create(Long templeId, CreateTrustRequest rq) {
        ownershipGuard.assertOwnsTemple(templeId);
        TrustRegistration trust = TrustRegistration.builder()
                .templeId(templeId)
                .trustName(rq.getTrustName())
                .trustType(rq.getTrustType())
                .registrationNumber(rq.getRegistrationNumber())
                .registeringAuthority(rq.getRegisteringAuthority())
                .dateOfRegistration(rq.getDateOfRegistration())
                .bankName(rq.getBankName())
                .bankBranch(rq.getBankBranch())
                .annualIncome(rq.getAnnualIncome())
                .build();
        TrustRegistration saved = trustRepository.save(trust);
        log.info("Trust created: id=[{}] for temple=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TrustResponse getById(Long id) {
        TrustRegistration trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        return toResponse(trust);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TrustResponse update(Long id, CreateTrustRequest rq) {
        TrustRegistration trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        trust.setTrustName(rq.getTrustName());
        trust.setTrustType(rq.getTrustType());
        trust.setAnnualIncome(rq.getAnnualIncome());
        return toResponse(trustRepository.save(trust));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<BoardMemberResponse> listBoardMembers(Long trustId) {
        return boardMemberRepository.findAllByTrustId(trustId).stream().map(this::toBoardResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        BoardMember member = BoardMember.builder()
                .trustId(trustId)
                .fullName(rq.getFullName())
                .aadhaarEncrypted(rq.getAadhaarNumber()) // @Convert handles encryption
                .designation(rq.getDesignation())
                .appointmentDate(rq.getAppointmentDate())
                .tenureEndDate(rq.getTenureEndDate())
                .contactNumber(rq.getContactNumber())
                .address(rq.getAddress())
                .isCurrent(true)
                .build();
        return toBoardResponse(boardMemberRepository.save(member));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void submitFinancial(Long trustId, SubmitTrustFinancialRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        TrustFinancial fin = TrustFinancial.builder()
                .trustId(trustId)
                .financialYear(rq.getFinancialYear())
                .annualIncome(rq.getAnnualIncome())
                .annualExpenditure(rq.getAnnualExpenditure())
                .submittedAt(LocalDateTime.now())
                .documentId(rq.getDocumentId())
                .build();
        financialRepository.save(fin);
        log.info("Financial submitted for trust [{}], FY [{}]", trustId, rq.getFinancialYear());
    }

    private TrustResponse toResponse(TrustRegistration t) {
        return TrustResponse.builder()
                .id(t.getId()).templeId(t.getTempleId()).trustName(t.getTrustName())
                .trustType(t.getTrustType()).registrationNumber(t.getRegistrationNumber())
                .registeringAuthority(t.getRegisteringAuthority())
                .dateOfRegistration(t.getDateOfRegistration())
                .bankName(t.getBankName()).bankBranch(t.getBankBranch())
                .annualIncome(t.getAnnualIncome()).build();
    }

    private BoardMemberResponse toBoardResponse(BoardMember bm) {
        String masked = bm.getAadhaarEncrypted() != null ? "XXXX-XXXX-" +
                bm.getAadhaarEncrypted().substring(Math.max(0, bm.getAadhaarEncrypted().length() - 4)) : null;
        return BoardMemberResponse.builder()
                .id(bm.getId()).trustId(bm.getTrustId()).fullName(bm.getFullName())
                .aadhaarMasked(masked).designation(bm.getDesignation())
                .appointmentDate(bm.getAppointmentDate()).tenureEndDate(bm.getTenureEndDate())
                .contactNumber(bm.getContactNumber()).isCurrent(bm.isCurrent()).build();
    }
}
