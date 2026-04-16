package com.templeregistry.service.impl.trust;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.*;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.trust.TrustService;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
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
    private final BoardMeetingRepository boardMeetingRepository;
    private final TrustFinancialRepository financialRepository;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final TempleRepository templeRepository;
    private final PaginationUtil paginationUtil;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TrustResponse> listByTemple(Long templeId) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        ownershipGuard.assertOwnsTemple(templeId);
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return trustRepository.findAllByTempleId(templeId).stream().map(this::toResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TrustResponse create(Long templeId, CreateTrustRequest rq) {
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        ownershipGuard.assertOwnsTemple(templeId);
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
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
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return toResponse(trust);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public TrustResponse update(Long id, CreateTrustRequest rq) {
        TrustRegistration trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        trust.setTrustName(rq.getTrustName());
        trust.setTrustType(rq.getTrustType());
        trust.setAnnualIncome(rq.getAnnualIncome());
        return toResponse(trustRepository.save(trust));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<BoardMemberResponse> listBoardMembers(Long trustId) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return boardMemberRepository.findAllByTrustId(trustId).stream().map(this::toBoardResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
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
    public BoardMemberResponse updateBoardMember(Long trustId, Long memberId, UpdateBoardMemberRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));

        // VAL-014: cessation date required when marking member as resigned
        if (Boolean.FALSE.equals(rq.getIsCurrent()) && rq.getTenureEndDate() == null) {
            throw new IllegalArgumentException(
                    "tenureEndDate (cessation date) is required when marking a board member as resigned (VAL-014).");
        }

        if (rq.getFullName() != null)        member.setFullName(rq.getFullName());
        if (rq.getDesignation() != null)     member.setDesignation(rq.getDesignation());
        if (rq.getAppointmentDate() != null) member.setAppointmentDate(rq.getAppointmentDate());
        if (rq.getContactNumber() != null)   member.setContactNumber(rq.getContactNumber());
        if (rq.getAddress() != null)         member.setAddress(rq.getAddress());
        if (rq.getIsCurrent() != null)       member.setCurrent(rq.getIsCurrent());
        if (rq.getTenureEndDate() != null)   member.setTenureEndDate(rq.getTenureEndDate());

        log.info("BoardMember updated: id=[{}] isCurrent=[{}]", memberId, member.isCurrent());
        return toBoardResponse(boardMemberRepository.save(member));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void submitFinancial(Long trustId, SubmitTrustFinancialRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());

        // VAL-013: one submission per trust per FY; immutable after submit
        boolean alreadySubmitted = financialRepository
                .findAllByTrustIdOrderByFinancialYearDesc(trustId).stream()
                .anyMatch(f -> f.getFinancialYear().equals(rq.getFinancialYear()));
        if (alreadySubmitted) {
            throw new IllegalStateException(
                    "Annual financials for financial year [" + rq.getFinancialYear()
                            + "] have already been submitted for this trust (VAL-013).");
        }

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

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TrustFinancialResponse> listFinancials(Long trustId) {
        TrustRegistration trust = trustRepository.findById(trustId).orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return financialRepository.findAllByTrustIdOrderByFinancialYearDesc(trustId)
                .stream().map(this::toFinancialResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMeetingResponse createBoardMeeting(Long trustId, CreateBoardMeetingRequest rq) {
        TrustRegistration trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        BoardMeeting meeting = BoardMeeting.builder()
                .trustId(trustId)
                .meetingDate(rq.getMeetingDate())
                .agenda(rq.getAgenda())
                .minutesDocumentId(rq.getMinutesDocumentId())
                .build();
        BoardMeeting saved = boardMeetingRepository.save(meeting);
        log.info("BoardMeeting created: id=[{}] trustId=[{}]", saved.getId(), trustId);
        return toMeetingResponse(saved);
    }

    private ScopeHelper.Claims currentClaims() {
        return (ScopeHelper.Claims) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<BoardMeetingResponse> listBoardMeetings(Long trustId, int page, int size) {
        trustRepository.findById(trustId).orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Page<BoardMeeting> result = boardMeetingRepository.findAllByTrustIdOrderByMeetingDateDesc(
                trustId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toMeetingResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public BoardMeetingResponse getBoardMeeting(Long meetingId) {
        BoardMeeting meeting = boardMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMeeting", meetingId));
        return toMeetingResponse(meeting);
    }

    /* ── Mapping helpers ─────────────────────────────────────────── */

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
        // VAL-007: Aadhaar always masked as XXXX-XXXX-{last4}
        String masked = bm.getAadhaarEncrypted() != null ? "XXXX-XXXX-" +
                bm.getAadhaarEncrypted().substring(Math.max(0, bm.getAadhaarEncrypted().length() - 4)) : null;
        return BoardMemberResponse.builder()
                .id(bm.getId()).trustId(bm.getTrustId()).fullName(bm.getFullName())
                .aadhaarMasked(masked).designation(bm.getDesignation())
                .appointmentDate(bm.getAppointmentDate()).tenureEndDate(bm.getTenureEndDate())
                .contactNumber(bm.getContactNumber()).isCurrent(bm.isCurrent()).build();
    }

    private TrustFinancialResponse toFinancialResponse(TrustFinancial f) {
        return TrustFinancialResponse.builder()
                .id(f.getId()).trustId(f.getTrustId()).financialYear(f.getFinancialYear())
                .annualIncome(f.getAnnualIncome()).annualExpenditure(f.getAnnualExpenditure())
                .submittedAt(f.getSubmittedAt()).documentId(f.getDocumentId()).build();
    }

    private BoardMeetingResponse toMeetingResponse(BoardMeeting m) {
        return BoardMeetingResponse.builder()
                .id(m.getId()).trustId(m.getTrustId()).meetingDate(m.getMeetingDate())
                .agenda(m.getAgenda()).minutesDocumentId(m.getMinutesDocumentId())
                .createdAt(m.getCreatedAt()).build();
    }
}
