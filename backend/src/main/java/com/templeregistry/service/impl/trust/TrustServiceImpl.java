package com.templeregistry.service.impl.trust;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.entity.document.Document;
import com.templeregistry.entity.workflow.WorkflowStatus;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.*;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.FileValidationException;
import com.templeregistry.repository.document.DocumentRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.*;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.audit.GovernanceAuditService;
import com.templeregistry.service.dc.NotificationEventPublisher;
import com.templeregistry.service.document.DocumentService;
import com.templeregistry.service.governance.GovernanceEditGuard;
import com.templeregistry.service.notification.NotificationHelper;
import com.templeregistry.service.notification.NotificationRecipientResolver;
import com.templeregistry.service.trust.TrustService;
import com.templeregistry.service.trust.TrustValidationService;
import com.templeregistry.service.workflow.WorkflowEngineAdaptor;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.service.governance.GovernanceStatusResolver;
import com.templeregistry.util.HmacUtil;
import com.templeregistry.util.PaginationUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

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
    private final TrustValidationService trustValidationService;
    private final DocumentService documentService;
    private final DocumentRepository documentRepository;
    private final HmacUtil hmacUtil;
    private final GovernanceEditGuard governanceEditGuard;
    private final GovernanceAuditService governanceAuditService;
    private final NotificationEventPublisher notificationPublisher;
    private final NotificationHelper notificationHelper;
    private final com.templeregistry.service.notification.NotificationEventPublisher eventPublisher;
    private final NotificationRecipientResolver recipientResolver;
    private final WorkflowEngineAdaptor workflowEngineAdaptor;
    private final GovernanceStatusResolver governanceStatusResolver;

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
        trustValidationService.validateTrustRequest(rq, null);
        // Prevent duplicate trust per temple
        if (trustRepository.existsByTempleIdAndDeletedFalse(templeId)) {
            throw new com.templeregistry.exception.DuplicateResourceException(
                    "A trust is already registered for this temple.");
        }
        Trust trust = Trust.builder()
                .templeId(templeId)
                .trustName(rq.getTrustName())
                .trustType(rq.getTrustType())
                .trustRegistrationNumber(rq.getRegistrationNumber().trim())
                .registeringAuthority(rq.getRegisteringAuthority().trim())
                .dateOfRegistration(rq.getDateOfRegistration())
                .trustPANNumber(rq.getPanNumber().trim().toUpperCase())
                .bankAccountNumber(rq.getBankAccountNumber().trim())
                .bankNameAndBranch(joinBankNameAndBranch(rq.getBankName(), rq.getBankBranch()))
                .annualIncome(rq.getAnnualIncome())
                .status(TrustStatus.ACTIVE)
                .build();
        Trust saved = trustRepository.save(trust);
        temple.setTrustRegistered(true);
        templeRepository.save(temple);
        // ── Workflow Engine: initiate governance instance ──────────────────────
        workflowEngineAdaptor.ensureInitiated(
            WorkflowEntityType.TRUST, saved.getId(),
            templeId, temple.getDistrictId(), currentUserId());
        log.info("Trust created: id=[{}] for temple=[{}]", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public TrustResponse getById(Long id) {
        Trust trust = trustRepository.findById(id)
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
    public TrustResponse update(Long id, UpdateTrustRequest rq) {
        Trust trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        trustValidationService.validateTrustUpdateRequest(rq, id);

        // Canonical status lookup — no longer reads Trust.submissionStatus (removed in Phase 4)
        WorkflowStatus statusBeforeEdit = workflowEngineAdaptor.currentStatus(
            WorkflowEntityType.TRUST, trust.getId());

        // Governance guard: assert TA can edit (blocks REJECTED and IN_REVIEW states)
        governanceEditGuard.assertCanEdit(statusBeforeEdit, "Trust", id);

        trust.setTrustName(rq.getTrustName());
        trust.setTrustType(rq.getTrustType());
        trust.setTrustRegistrationNumber(rq.getRegistrationNumber().trim());
        trust.setRegisteringAuthority(rq.getRegisteringAuthority().trim());
        trust.setDateOfRegistration(rq.getDateOfRegistration());
        // Only overwrite sensitive fields when the user explicitly provides a new value
        if (rq.getPanNumber() != null && !rq.getPanNumber().isBlank()) {
            trust.setTrustPANNumber(rq.getPanNumber().trim().toUpperCase());
        }
        if (rq.getBankAccountNumber() != null && !rq.getBankAccountNumber().isBlank()) {
            trust.setBankAccountNumber(rq.getBankAccountNumber().trim());
        }
        trust.setBankNameAndBranch(joinBankNameAndBranch(rq.getBankName(), rq.getBankBranch()));
        trust.setAnnualIncome(rq.getAnnualIncome());

        // Re-submission: if trust was APPROVED/RE_APPROVED and TA edits, trigger re-submission workflow
        if (governanceEditGuard.requiresResubmission(statusBeforeEdit)) {
            trust.setSendBackReason(null);
            workflowEngineAdaptor.adaptEditApproved(
                WorkflowEntityType.TRUST, trust.getId(), currentUserId(), trust.getTempleId());
            notificationHelper.notifyTrustUpdated(trust.getId(), trust.getTempleId(), trust.getTrustName(), currentUserId());
            log.info("Trust [{}] moved to UPDATED_AFTER_APPROVAL after TA edit (was {}). TA must resubmit to complete DC re-review.", id, statusBeforeEdit);
        }

        return toResponse(trustRepository.save(trust));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public BoardMemberGroupResponse listBoardMembers(Long trustId, Boolean currentOnly) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        List<BoardMemberResponse> mapped = boardMemberRepository.findAllByTrustIdOrderByAppointmentDateDescIdDesc(trustId)
                .stream()
                .map(this::toBoardResponse)
                .toList();

        List<BoardMemberResponse> current = mapped.stream().filter(BoardMemberResponse::isCurrent).toList();
        List<BoardMemberResponse> past = mapped.stream().filter(member -> !member.isCurrent()).toList();

        if (Boolean.TRUE.equals(currentOnly)) {
            return BoardMemberGroupResponse.builder().current(current).past(List.of()).build();
        }
        if (Boolean.FALSE.equals(currentOnly)) {
            return BoardMemberGroupResponse.builder().current(List.of()).past(past).build();
        }
        return BoardMemberGroupResponse.builder().current(current).past(past).build();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMemberResponse addBoardMember(Long trustId, CreateBoardMemberRequest rq) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        trustValidationService.validateBoardMemberCreate(trustId, rq);
        String aadhaar = rq.getAadhaarNumber();
        BoardMember member = BoardMember.builder()
                .trustId(trustId)
                .fullName(rq.getFullName())
                .aadhaarEncrypted(aadhaar) // @Convert handles AES-GCM encryption
                .aadhaarHash(hmacUtil.hash(aadhaar))
                .aadhaarLast4(aadhaar != null && aadhaar.length() >= 4
                        ? aadhaar.substring(aadhaar.length() - 4) : null)
                .designation(rq.getDesignation())
                .appointmentDate(rq.getAppointmentDate())
                .tenureEndDate(rq.getTenureEndDate())
                .contactNumber(rq.getContactNumber())
                .address(rq.getAddress())
                .isCurrent(trustValidationService.isCurrentMember(rq.getTenureEndDate()))
                .build();
        BoardMember saved = boardMemberRepository.save(member);
        // ── Workflow Engine: initiate + auto-submit board member for DC review ─
        // Board members are immediately available for DC review when added by TA.
        // ensureInitiated creates the DRAFT instance; adaptSubmit transitions it to SUBMITTED.
        workflowEngineAdaptor.ensureInitiated(
            WorkflowEntityType.BOARD_MEMBER, saved.getId(),
            trust.getTempleId(), temple.getDistrictId(), currentUserId());
        workflowEngineAdaptor.adaptSubmit(
            WorkflowEntityType.BOARD_MEMBER, saved.getId(),
            trust.getTempleId(), temple.getDistrictId(), currentUserId());
        // Notify via helper (structural requirement)
        notificationHelper.notifyBoardMemberAdded(saved.getId(), trust.getTempleId(), trust.getTrustName(), saved.getFullName(), currentUserId());
        
        Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
        for (Long dcId : dcIds) {
            eventPublisher.publish(new com.templeregistry.event.board.BoardMemberAddedEvent(
                this, saved.getId(), trust.getTrustName(), saved.getFullName(),
                saved.getDesignation(), currentUserId(), dcId));
        }
        return toBoardResponse(saved);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMemberResponse updateBoardMember(Long trustId, Long memberId, UpdateBoardMemberRequest rq) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        if (!Objects.equals(member.getTrustId(), trustId)) {
            throw new EntityNotFoundException("BoardMember", memberId);
        }
        trustValidationService.validateBoardMemberUpdate(trustId, member, rq);

        if (rq.getFullName() != null)        member.setFullName(rq.getFullName());
        if (rq.getDesignation() != null)     member.setDesignation(rq.getDesignation());
        if (rq.getAppointmentDate() != null) member.setAppointmentDate(rq.getAppointmentDate());
        if (rq.getContactNumber() != null)   member.setContactNumber(rq.getContactNumber());
        if (rq.getAddress() != null)         member.setAddress(rq.getAddress());
        if (rq.getTenureEndDate() != null)   member.setTenureEndDate(rq.getTenureEndDate());
        if (Boolean.FALSE.equals(rq.getCurrent()) && rq.getTenureEndDate() == null) {
            member.setTenureEndDate(LocalDate.now());
        }
        member.setCurrent(trustValidationService.isCurrentMember(member.getTenureEndDate()));

        log.info("BoardMember updated: id=[{}] isCurrent=[{}]", memberId, member.isCurrent());
        BoardMember updated = boardMemberRepository.save(member);
        // Notify via helper (structural requirement)
        notificationHelper.notifyBoardMemberUpdated(updated.getId(), trust.getTempleId(), trust.getTrustName(), updated.getFullName(), currentUserId());

        Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
        for (Long dcId : dcIds) {
            eventPublisher.publish(new com.templeregistry.event.board.BoardMemberUpdatedEvent(
                this, updated.getId(), trust.getTrustName(), updated.getFullName(),
                currentUserId(), dcId));
        }
        return toBoardResponse(updated);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT + " or " + RoleConstants.ADMIN_ONLY)
    @Transactional
    public void deleteBoardMember(Long trustId, Long memberId) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        if (!Objects.equals(member.getTrustId(), trustId)) {
            throw new EntityNotFoundException("BoardMember", memberId);
        }
        boardMemberRepository.delete(member);
        // Notify via helper (structural requirement)
        notificationHelper.notifyBoardMemberRemoved(member.getId(), trust.getTempleId(), trust.getTrustName(), member.getFullName(), currentUserId());

        Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
        for (Long dcId : dcIds) {
            eventPublisher.publish(new com.templeregistry.event.board.BoardMemberRemovedEvent(
                this, member.getId(), trust.getTrustName(), member.getFullName(),
                currentUserId(), dcId));
        }
    }

    @Override
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Transactional
    public BoardMemberResponse approveBoardMember(Long trustId, Long memberId, String remarks,
                                                   com.templeregistry.security.ScopeHelper.Claims claims) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        jurisdictionGuard.assertDistrictScope(temple, claims);
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        if (!Objects.equals(member.getTrustId(), trustId)) {
            throw new EntityNotFoundException("BoardMember", memberId);
        }
        member.setVerifiedByDc(true);
        boardMemberRepository.save(member);
        // ── Workflow Engine: adapt board member approval ───────────────────────
        workflowEngineAdaptor.adaptApprove(
            WorkflowEntityType.BOARD_MEMBER, memberId, claims.districtId(), claims.userId());
        log.info("BoardMember [{}] APPROVED by DC userId={}", memberId, claims.userId());
        return toBoardResponse(member);
    }

    @Override
    @PreAuthorize(RoleConstants.IS_DC_ROLE)
    @Transactional
    public BoardMemberResponse rejectBoardMember(Long trustId, Long memberId, String reason,
                                                  com.templeregistry.security.ScopeHelper.Claims claims) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        jurisdictionGuard.assertDistrictScope(temple, claims);
        BoardMember member = boardMemberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMember", memberId));
        if (!Objects.equals(member.getTrustId(), trustId)) {
            throw new EntityNotFoundException("BoardMember", memberId);
        }
        member.setVerifiedByDc(false);
        boardMemberRepository.save(member);
        // ── Workflow Engine: adapt board member rejection ──────────────────────
        workflowEngineAdaptor.adaptReject(
            WorkflowEntityType.BOARD_MEMBER, memberId, claims.districtId(), claims.userId(), reason);
        log.info("BoardMember [{}] REJECTED by DC userId={} reason={}", memberId, claims.userId(), reason);
        return toBoardResponse(member);
    }

    @Override
    @PreAuthorize(RoleConstants.ADMIN_ONLY)
    @Transactional
    public void deleteTrust(Long id) {
        Trust trust = trustRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trust", id));
        trustRepository.delete(trust);
        templeRepository.findById(trust.getTempleId()).ifPresent(temple -> {
            temple.setTrustRegistered(trustRepository.existsByTempleIdAndDeletedFalse(temple.getId()));
        });
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void submitFinancial(Long trustId, SubmitTrustFinancialRequest rq) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        trustValidationService.validateFinancialRequest(trustId, rq);

        TrustFinancial fin = TrustFinancial.builder()
                .trustId(trustId)
                .financialYear(rq.getFinancialYear().trim())
                .annualIncome(rq.getAnnualIncome())
                .annualExpenditure(rq.getAnnualExpenditure())
                .submittedAt(LocalDateTime.now())
                .documentId(rq.getDocumentId())
                .build();
        financialRepository.save(fin);
        log.info("Financial submitted for trust [{}], FY [{}]", trustId, rq.getFinancialYear());

        // Notify DCs of financial submission
        Long[] dcIds = recipientResolver.getDistrictCollectorsForTemple(trust.getTempleId());
        for (Long dcId : dcIds) {
            eventPublisher.publish(new com.templeregistry.event.finance.FinanceSubmittedEvent(
                this, trust.getId(), trust.getTrustName(), rq.getFinancialYear().trim(),
                currentUserId(), dcId));
        }
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<TrustFinancialResponse> listFinancials(Long trustId) {
        Trust trust = trustRepository.findById(trustId).orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return financialRepository.findAllByTrustIdOrderByFinancialYearDesc(trustId)
                .stream().map(this::toFinancialResponse).toList();
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public BoardMeetingResponse createBoardMeeting(Long trustId, CreateBoardMeetingRequest rq) {
        Trust trust = trustRepository.findById(trustId)
                .orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        trustValidationService.validateBoardMeetingRequest(rq);
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

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<BoardMeetingResponse> listBoardMeetings(Long trustId, int page, int size) {
        Trust trust = trustRepository.findById(trustId).orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        Page<BoardMeeting> result = boardMeetingRepository.findAllByTrustIdOrderByMeetingDateDesc(
                trustId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toMeetingResponse));
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public BoardMeetingResponse getBoardMeeting(Long trustId, Long meetingId) {
        BoardMeeting meeting = findMeeting(trustId, meetingId);
        return toMeetingResponse(meeting);
    }

    @Override
    @Transactional
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    public BoardMeetingResponse uploadMeetingMinutes(Long trustId, Long meetingId, MultipartFile file) {
        BoardMeeting meeting = findMeeting(trustId, meetingId);
        if (file == null || file.isEmpty()) {
            throw new FileValidationException("Meeting minutes file is required.");
        }
        if (!MediaType.APPLICATION_PDF_VALUE.equalsIgnoreCase(file.getContentType())) {
            throw new FileValidationException("Only PDF meeting minutes are allowed.");
        }
        if (file.getSize() > 10 * 1024 * 1024L) {
            throw new FileValidationException("Meeting minutes cannot exceed 10 MB.");
        }

        Document document = documentRepository.findById(
                documentService.upload("TRUST", trustId, meetingId, "Meeting Minutes", file).getId()
        ).orElseThrow(() -> new EntityNotFoundException("Document", "meeting_minutes"));
        meeting.setMinutesDocumentId(document.getId());
        return toMeetingResponse(boardMeetingRepository.save(meeting));
    }

    @Override
    @Transactional
    @PreAuthorize("isAuthenticated()")
    public Resource downloadMeetingMinutes(Long trustId, Long meetingId) {
        BoardMeeting meeting = findMeeting(trustId, meetingId);
        if (meeting.getMinutesDocumentId() == null) {
            throw new EntityNotFoundException("MeetingMinutes", meetingId);
        }
        return documentService.download(meeting.getMinutesDocumentId());
    }

    private BoardMeeting findMeeting(Long trustId, Long meetingId) {
        BoardMeeting meeting = boardMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new EntityNotFoundException("BoardMeeting", meetingId));
        if (!Objects.equals(meeting.getTrustId(), trustId)) {
            throw new EntityNotFoundException("BoardMeeting", meetingId);
        }
        Trust trust = trustRepository.findById(trustId).orElseThrow(() -> new EntityNotFoundException("Trust", trustId));
        Temple temple = templeRepository.findById(trust.getTempleId())
                .orElseThrow(() -> new EntityNotFoundException("Temple", trust.getTempleId()));
        ownershipGuard.assertOwnsTemple(trust.getTempleId());
        jurisdictionGuard.assertDistrictScope(temple, currentClaims());
        return meeting;
    }

    /* ── Mapping helpers ─────────────────────────────────────────── */

    private TrustResponse toResponse(Trust t) {
        String[] bankParts = splitBankNameAndBranch(t.getBankNameAndBranch());
        return TrustResponse.builder()
                .id(t.getId())
                .workflowInstanceId(workflowEngineAdaptor.getWorkflowInstanceId(
                    WorkflowEntityType.TRUST, t.getId()))
                .templeId(t.getTempleId()).trustName(t.getTrustName())
                .trustType(t.getTrustType()).registrationNumber(t.getTrustRegistrationNumber())
                .registeringAuthority(t.getRegisteringAuthority())
                .dateOfRegistration(t.getDateOfRegistration())
                .maskedPanNumber(maskPan(t.getTrustPANNumber()))
                .maskedBankAccountNumber(maskBankAccount(t.getBankAccountNumber()))
                .bankName(bankParts[0])
                .bankBranch(bankParts[1])
                .annualIncome(t.getAnnualIncome())
                .status(t.getStatus())
                .active(t.getStatus() == TrustStatus.ACTIVE)
                .dissolvedAt(t.getDissolutionDate())
                .dissolutionReason(t.getDissolutionReason())
                .sendBackReason(t.getSendBackReason())
                .governanceStatus(governanceStatusResolver.resolve(WorkflowEntityType.TRUST, t.getId()))
                .build();
    }

    private BoardMemberResponse toBoardResponse(BoardMember bm) {
        boolean isCurrent = trustValidationService.isCurrentMember(bm.getTenureEndDate());
        return BoardMemberResponse.builder()
                .id(bm.getId()).trustId(bm.getTrustId()).fullName(bm.getFullName())
                .maskedAadhaar(bm.getMaskedAadhaar()).designation(bm.getDesignation())
                .appointmentDate(bm.getAppointmentDate()).tenureEndDate(bm.getTenureEndDate())
                .contactNumber(bm.getContactNumber()).address(bm.getAddress()).current(isCurrent)
                .build();
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

    private String joinBankNameAndBranch(String bankName, String bankBranch) {
        return bankName.trim() + "||" + bankBranch.trim();
    }

    private String[] splitBankNameAndBranch(String bankNameAndBranch) {
        if (bankNameAndBranch == null || bankNameAndBranch.isBlank()) {
            return new String[] {null, null};
        }
        String[] parts = bankNameAndBranch.split("\\|\\|", 2);
        if (parts.length == 2) {
            return parts;
        }
        int lastSpace = bankNameAndBranch.lastIndexOf(' ');
        if (lastSpace <= 0) {
            return new String[] {bankNameAndBranch, null};
        }
        return new String[] {
                bankNameAndBranch.substring(0, lastSpace),
                bankNameAndBranch.substring(lastSpace + 1)
        };
    }

    private String maskPan(String pan) {
        if (pan == null || pan.length() < 4) {
            return null;
        }
        return pan.substring(0, 2) + "*****" + pan.substring(pan.length() - 2);
    }

    private String maskBankAccount(String account) {
        if (account == null || account.length() < 4) {
            return null;
        }
        return "******" + account.substring(account.length() - 4);
    }
}
