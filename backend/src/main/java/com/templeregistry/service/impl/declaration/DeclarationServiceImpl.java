package com.templeregistry.service.impl.declaration;

import com.templeregistry.common.PaginatedResponse;
import com.templeregistry.dto.request.declaration.*;
import com.templeregistry.dto.response.declaration.*;
import com.templeregistry.entity.declaration.*;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.exception.JurisdictionAccessDeniedException;
import com.templeregistry.repository.declaration.*;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.declaration.DeclarationService;
import com.templeregistry.util.AcknowledgementNumberGenerator;
import com.templeregistry.util.PaginationUtil;
import com.templeregistry.util.StatusTransitionValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeclarationServiceImpl implements DeclarationService {

    private final DeclarationRepository declarationRepository;
    private final DeclarationClarificationRepository clarificationRepository;
    private final TempleRepository templeRepository;
    private final OwnershipGuard ownershipGuard;
    private final JurisdictionGuard jurisdictionGuard;
    private final StatusTransitionValidator transitionValidator;
    private final AcknowledgementNumberGenerator ackGenerator;
    private final PaginationUtil paginationUtil;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public PaginatedResponse<DeclarationResponse> listByTemple(Long templeId, int page, int size) {
        ownershipGuard.assertOwnsTemple(templeId);
        Page<AssetDeclaration> result = declarationRepository.findAllByTempleId(
                templeId, PageRequest.of(page, paginationUtil.clampSize(size)));
        return PaginatedResponse.of(result.map(this::toResponse));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public DeclarationResponse create(Long templeId, CreateDeclarationRequest rq) {
        ownershipGuard.assertOwnsTemple(templeId);
        Temple temple = templeRepository.findById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        AssetDeclaration d = buildFromRequest(rq, templeId, temple.getDistrictId());
        AssetDeclaration saved = declarationRepository.save(d);
        log.info("Declaration created: id=[{}] temple=[{}] status=DRAFT", saved.getId(), templeId);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public DeclarationResponse getById(Long id) {
        AssetDeclaration d = findOrThrow(id);
        assertAccess(d);
        return toResponse(d);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public DeclarationResponse update(Long id, CreateDeclarationRequest rq) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        if (d.getStatus() != DeclarationStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT declarations can be updated.");
        }
        applyFields(d, rq);
        return toResponse(declarationRepository.save(d));
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void submit(Long id) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(), DeclarationStatus.PENDING_REVIEW.name());
        d.setStatus(DeclarationStatus.PENDING_REVIEW);
        d.setSubmittedAt(LocalDateTime.now());
        declarationRepository.save(d);
        log.info("Declaration [{}] submitted.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void approve(Long id) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(), DeclarationStatus.APPROVED.name());
        d.setStatus(DeclarationStatus.APPROVED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(currentUserId());
        d.setAcknowledgementNumber(ackGenerator.generate());
        declarationRepository.save(d);
        log.info("Declaration [{}] approved. Ack=[{}]", id, d.getAcknowledgementNumber());
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void reject(Long id, ClarificationRequest reason) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(d.getStatus().name(), DeclarationStatus.REJECTED.name());
        d.setStatus(DeclarationStatus.REJECTED);
        d.setReviewedAt(LocalDateTime.now());
        d.setReviewedBy(currentUserId());
        declarationRepository.save(d);
        saveClarification(id, reason.getMessage(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Declaration [{}] rejected.", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void requestClarification(Long id, ClarificationRequest request) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.CLARIFICATION_REQUESTED.name());
        d.setStatus(DeclarationStatus.CLARIFICATION_REQUESTED);
        declarationRepository.save(d);
        saveClarification(id, request.getMessage(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Clarification requested for declaration [{}].", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_APPROVE)
    @Transactional
    public void flagPhysicalVerification(Long id, FlagPhysicalVerificationRequest request) {
        AssetDeclaration d = findOrThrow(id);
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED.name());
        d.setStatus(DeclarationStatus.PHYSICAL_VERIFICATION_REQUESTED);
        declarationRepository.save(d);
        saveClarification(id, request.getNotes(), ClarificationDirection.DC_TO_TEMPLE);
        log.info("Physical verification flagged for declaration [{}].", id);
    }

    @Override
    @PreAuthorize(RoleConstants.CAN_SUBMIT)
    @Transactional
    public void resubmit(Long id, ResubmitDeclarationRequest rq) {
        AssetDeclaration d = findOrThrow(id);
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        transitionValidator.validateDeclarationTransition(
                d.getStatus().name(), DeclarationStatus.PENDING_REVIEW.name());
        applyResubmitFields(d, rq);
        d.setStatus(DeclarationStatus.PENDING_REVIEW);
        d.setSubmittedAt(LocalDateTime.now());
        declarationRepository.save(d);
        saveClarification(id, rq.getCorrectionNotes(), ClarificationDirection.TEMPLE_TO_DC);
        log.info("Declaration [{}] resubmitted.", id);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public AcknowledgementResponse getAcknowledgement(Long id) {
        AssetDeclaration d = findOrThrow(id);
        assertAccess(d);
        if (d.getStatus() != DeclarationStatus.APPROVED) {
            throw new IllegalStateException("Acknowledgement is only available for APPROVED declarations.");
        }
        // TODO: Generate pre-signed S3 URL for the PDF acknowledgement
        return AcknowledgementResponse.builder()
                .acknowledgementNumber(d.getAcknowledgementNumber())
                .downloadUrl("presigned-url-placeholder")
                .generatedAt(LocalDateTime.now())
                .build();
    }

    @Override
    @Scheduled(cron = "0 0 6 * * *") // daily at 6 AM
    @Transactional
    public void flagOverdue() {
        List<AssetDeclaration> overdue = declarationRepository.findOverdue(LocalDate.now());
        log.info("Overdue declarations found: {}", overdue.size());
        // TODO: send notifications for each overdue declaration
    }

    private AssetDeclaration findOrThrow(Long id) {
        return declarationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", id));
    }

    private void assertAccess(AssetDeclaration d) {
        ownershipGuard.assertOwnsTemple(d.getTempleId());
        jurisdictionGuard.assertSameDistrict(d.getDistrictId());
    }

    private Long currentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof ScopeHelper.Claims c) return c.userId();
        return 0L;
    }

    private void saveClarification(Long declarationId, String message, ClarificationDirection direction) {
        clarificationRepository.save(DeclarationClarification.builder()
                .declarationId(declarationId)
                .direction(direction)
                .message(message)
                .authorId(currentUserId())
                .build());
    }

    private AssetDeclaration buildFromRequest(CreateDeclarationRequest rq, Long templeId, Long districtId) {
        return AssetDeclaration.builder()
                .templeId(templeId).districtId(districtId).status(DeclarationStatus.DRAFT)
                .agriculturalLandAcres(rq.getAgriculturalLandAcres()).agriculturalLandValue(rq.getAgriculturalLandValue())
                .buildingsSqft(rq.getBuildingsSqft()).buildingsValue(rq.getBuildingsValue())
                .leasedPropertiesCount(rq.getLeasedPropertiesCount()).leasedPropertiesValue(rq.getLeasedPropertiesValue())
                .otherLandValue(rq.getOtherLandValue()).goldGrams(rq.getGoldGrams()).silverGrams(rq.getSilverGrams())
                .idolsCount(rq.getIdolsCount()).vehiclesCount(rq.getVehiclesCount())
                .financialAssetsValue(rq.getFinancialAssetsValue()).otherMovableValue(rq.getOtherMovableValue())
                .dueDate(rq.getDueDate()).build();
    }

    private void applyFields(AssetDeclaration d, CreateDeclarationRequest rq) {
        d.setAgriculturalLandAcres(rq.getAgriculturalLandAcres()); d.setAgriculturalLandValue(rq.getAgriculturalLandValue());
        d.setBuildingsSqft(rq.getBuildingsSqft()); d.setBuildingsValue(rq.getBuildingsValue());
        d.setGoldGrams(rq.getGoldGrams()); d.setSilverGrams(rq.getSilverGrams());
        d.setFinancialAssetsValue(rq.getFinancialAssetsValue()); d.setOtherMovableValue(rq.getOtherMovableValue());
        d.setDueDate(rq.getDueDate());
    }

    private void applyResubmitFields(AssetDeclaration d, ResubmitDeclarationRequest rq) {
        if (rq.getAgriculturalLandAcres() != null) d.setAgriculturalLandAcres(rq.getAgriculturalLandAcres());
        if (rq.getGoldGrams() != null) d.setGoldGrams(rq.getGoldGrams());
        if (rq.getSilverGrams() != null) d.setSilverGrams(rq.getSilverGrams());
        if (rq.getFinancialAssetsValue() != null) d.setFinancialAssetsValue(rq.getFinancialAssetsValue());
    }

    private DeclarationResponse toResponse(AssetDeclaration d) {
        return DeclarationResponse.builder()
                .id(d.getId()).templeId(d.getTempleId()).districtId(d.getDistrictId())
                .status(d.getStatus()).agriculturalLandAcres(d.getAgriculturalLandAcres())
                .agriculturalLandValue(d.getAgriculturalLandValue()).buildingsSqft(d.getBuildingsSqft())
                .buildingsValue(d.getBuildingsValue()).goldGrams(d.getGoldGrams()).silverGrams(d.getSilverGrams())
                .idolsCount(d.getIdolsCount()).vehiclesCount(d.getVehiclesCount())
                .financialAssetsValue(d.getFinancialAssetsValue()).otherMovableValue(d.getOtherMovableValue())
                .submittedAt(d.getSubmittedAt()).reviewedAt(d.getReviewedAt())
                .acknowledgementNumber(d.getAcknowledgementNumber()).dueDate(d.getDueDate()).build();
    }
}
