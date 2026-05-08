package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.dto.response.dc.*;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.geo.City;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleProfileStaging;
import com.templeregistry.entity.workflow.WorkflowEntityType;
import com.templeregistry.entity.workflow.WorkflowInstance;
import com.templeregistry.service.workflow.WorkflowEngine;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.BoardMeeting;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.entity.trust.TrustFinancial;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.dc.*;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.geo.CityRepository;
import com.templeregistry.repository.temple.TempleProfileStagingRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.BoardMeetingRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import com.templeregistry.service.document.FileStorageService;
import com.templeregistry.service.trust.TrustValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleProfileServiceImpl implements DcTempleProfileService {
        private final FileStorageService fileStorageService;

        private final TempleRepository templeRepository;
        private final TempleSearchSummaryRepository summaryRepository;
        private final TrustRepository trustRepository;
        private final BoardMemberRepository boardMemberRepository;
        private final BoardMeetingRepository boardMeetingRepository;
        private final TrustFinancialRepository trustFinancialRepository;
        private final EmployeeRepository employeeRepository;
        private final ContractorRepository contractorRepository;
        private final DeclarationRepository declarationRepository;
        private final DeclarationClarificationRepository clarificationRepository;
        private final TempleProfileCurrentRepository profileCurrentRepository;
        private final TempleProfileStagingRepository profileStagingRepository;
        private final DeclImmovAgriLandRepository agriLandRepository;
        private final DeclImmovBuildingRepository buildingRepository;
        private final DeclImmovLeasedRepository leasedRepository;
        private final DeclImmovOtherRepository otherImmovRepository;
        private final DeclMovPreciousMetalRepository preciousMetalRepository;
        private final DeclMovArtifactRepository artifactRepository;
        private final DeclMovVehicleRepository vehicleRepository;
        private final DeclMovEquipmentRepository equipmentRepository;
        private final CityRepository cityRepository;
        private final JurisdictionGuard jurisdictionGuard;
        private final TrustValidationService trustValidationService;
        private final WorkflowEngine workflowEngine;
        private final com.templeregistry.service.governance.GovernanceStatusResolver governanceStatusResolver;

        @Override
        @Transactional(readOnly = true)
        @PreAuthorize(RoleConstants.CAN_READ_ALL)
        public TempleFullProfileResponse getFullProfile(Long templeId, ScopeHelper.Claims claims) {
                Temple temple = templeRepository.findWithGeoById(templeId)
                                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
                // Enforce district scope for DC/DC_STAFF. SUPER_ADMIN and AUDITOR are not
                // jurisdiction-scoped.
                if (RoleConstants.DISTRICT_COLLECTOR.equals(claims.role())
                                || RoleConstants.DC_STAFF.equals(claims.role())) {
                        jurisdictionGuard.assertDistrictScope(temple, claims);
                }

                // Geo names from eagerly loaded chain — each hop null-checked to handle
                // incomplete seed data
                String hobliName = null;
                String talukName = null;
                String districtName = null;

                if (temple.getHobli() == null) {
                        log.warn("Incomplete geo data: hobli is null for templeId={}", templeId);
                } else {
                        hobliName = temple.getHobli().getName();
                        if (temple.getHobli().getTaluk() == null) {
                                log.warn("Incomplete geo data: taluk is null for hobliId={}, templeId={}",
                                                temple.getHobliId(), templeId);
                        } else {
                                talukName = temple.getHobli().getTaluk().getName();
                                if (temple.getHobli().getTaluk().getDistrict() == null) {
                                        log.warn("Incomplete geo data: district is null for talukId={}, templeId={}",
                                                        temple.getHobli().getTaluk().getId(), templeId);
                                } else {
                                        districtName = temple.getHobli().getTaluk().getDistrict().getName();
                                }
                        }
                }

                // City name via summary — cityId guarded against null to prevent
                // IllegalArgumentException
                // city_id may be NULL in temple_search_summary rows seeded before V12 was
                // applied
                String cityName = summaryRepository.findByTempleId(templeId)
                                .filter(s -> s.getCityId() != null)
                                .flatMap(s -> cityRepository.findById(s.getCityId()))
                                .map(City::getName)
                                .orElse(null);

                // Trust (use the first active trust registration)
                List<Trust> trusts = trustRepository.findAllByTempleId(templeId);
                Trust primaryTrust = trusts.isEmpty() ? null : trusts.get(0);

                TempleFullProfileResponse.DcTrustSummary trustSummary = null;
                TempleFullProfileResponse.BoardMemberSection boardMembers = TempleFullProfileResponse.BoardMemberSection.builder()
                                .current(List.of())
                                .past(List.of())
                                .validationIssues(List.of())
                                .build();
                List<TempleFullProfileResponse.TrustFinancialSummary> financials = List.of();
                List<TempleFullProfileResponse.BoardMeetingSummary> meetings = List.of();

                if (primaryTrust != null) {
                        trustSummary = toTrustSummary(primaryTrust, claims);
                        List<TempleFullProfileResponse.BoardMemberSummary> allMembers = boardMemberRepository
                                        .findAllByTrustIdOrderByAppointmentDateDescIdDesc(primaryTrust.getId())
                                        .stream().map(this::toBoardMemberResponse).toList();
                        boardMembers = TempleFullProfileResponse.BoardMemberSection.builder()
                                        .current(allMembers.stream().filter(TempleFullProfileResponse.BoardMemberSummary::isCurrent).toList())
                                        .past(allMembers.stream().filter(member -> !member.isCurrent()).toList())
                                        .validationIssues(buildBoardMemberValidationIssues(allMembers))
                                        .build();
                        financials = trustFinancialRepository
                                        .findAllByTrustIdOrderByFinancialYearDesc(primaryTrust.getId())
                                        .stream().map(this::toFinancialSummary).toList();
                        meetings = boardMeetingRepository
                                        .findAllByTrustIdOrderByMeetingDateDesc(primaryTrust.getId())
                                        .stream().map(this::toBoardMeetingSummary).toList();
                }

                // Employees (max 100 for DC view)
                List<EmployeeResponse> employees = employeeRepository
                                .findAllByTempleId(templeId, PageRequest.of(0, 100))
                                .stream().map(this::toEmployeeResponse).toList();

                // Contractors (max 100 for DC view)
                List<ContractorResponse> contractors = contractorRepository
                                .findAllByTempleId(templeId, PageRequest.of(0, 100))
                                .stream().map(this::toContractorResponse).toList();

                // Declarations (most recent 10, excluding DRAFT — DCs should not see TA workspace drafts)
                List<DeclarationResponse> declarations = declarationRepository
                                .findAllByTempleIdExcludingDraft(templeId, PageRequest.of(0, 10,
                                        Sort.by(Sort.Order.desc("submittedAt"), Sort.Order.desc("versionNumber"), Sort.Order.desc("id"))))
                                .stream().map(this::toDeclarationResponse).toList();

                // Current approved profile
                TempleFullProfileResponse.ProfileCurrentResponse currentProfile = profileCurrentRepository
                                .findByTempleId(templeId)
                                .map(this::toProfileCurrentResponse)
                                .orElse(null);

                log.info("DC full profile loaded: templeId={}", templeId);

                return TempleFullProfileResponse.builder()
                                .temple(toTempleResponse(temple))
                                .hobliName(hobliName)
                                .talukName(talukName)
                                .districtName(districtName)
                                .cityName(cityName)
                                .trust(trustSummary)
                                .boardMembers(boardMembers)
                                .trustFinancials(financials)
                                .boardMeetings(meetings)
                                .employees(employees)
                                .contractors(contractors)
                                .declarations(declarations)
                                .currentProfile(currentProfile)
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        @PreAuthorize(RoleConstants.CAN_READ_ALL)
        public DeclarationDetailResponse getDeclarationDetail(Long declarationId, ScopeHelper.Claims claims) {
                AssetDeclaration d = declarationRepository.findById(declarationId)
                                .orElseThrow(() -> new EntityNotFoundException("AssetDeclaration", declarationId));

                Temple temple = templeRepository.findWithGeoById(d.getTempleId())
                                .orElseThrow(() -> new EntityNotFoundException("Temple", d.getTempleId()));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                List<ClarificationItemResponse> clarifications = clarificationRepository
                                .findAllByDeclarationIdOrderByCreatedAtAsc(declarationId)
                                .stream().map(this::toClarificationResponse).toList();

                log.info("DC declaration detail loaded: declarationId={}", declarationId);

                return DeclarationDetailResponse.builder()
                                .id(d.getId())
                                .templeId(d.getTempleId())
                                .districtId(d.getDistrictId())
                                .financialYear(d.getFinancialYear())
                                .versionNumber(d.getVersionNumber())
                                .status(d.getStatus())
                                .agriculturalLandAcres(d.getAgriculturalLandAcres())
                                .agriculturalLandValue(d.getAgriculturalLandValue())
                                .buildingsSqft(d.getBuildingsSqft())
                                .buildingsValue(d.getBuildingsValue())
                                .leasedPropertiesCount(d.getLeasedPropertiesCount())
                                .leasedPropertiesValue(d.getLeasedPropertiesValue())
                                .otherLandValue(d.getOtherLandValue())
                                .goldGrams(d.getGoldGrams())
                                .silverGrams(d.getSilverGrams())
                                .idolsCount(d.getIdolsCount())
                                .vehiclesCount(d.getVehiclesCount())
                                .financialAssetsValue(d.getFinancialAssetsValue())
                                .otherMovableValue(d.getOtherMovableValue())
                                .submittedAt(d.getSubmittedAt())
                                .reviewedAt(d.getReviewedAt())
                                .acknowledgementNumber(d.getAcknowledgementNumber())
                                .dueDate(d.getDueDate())
                                .clarificationRound(d.getClarificationRound())
                                .overdue(d.isOverdue())
                                .clarifications(clarifications)
                                .agricultureLands(agriLandRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclImmovAgriLandResponse.builder()
                                                                .id(e.getId()).surveyNumber(e.getSurveyNumber())
                                                                .areaAcres(e.getAreaAcres()).location(e.getLocation())
                                                                .encumbrance(e.getEncumbrance())
                                                                .annualLeaseIncome(e.getAnnualLeaseIncome())
                                                                .build())
                                                .toList())
                                .buildings(buildingRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclImmovBuildingResponse.builder()
                                                                .id(e.getId()).structureType(e.getStructureType())
                                                                .areaSqft(e.getAreaSqft())
                                                                .conditionText(e.getConditionText())
                                                                .valuation(e.getValuation())
                                                                .build())
                                                .toList())
                                .leasedProperties(leasedRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclImmovLeasedResponse.builder()
                                                                .id(e.getId()).lesseeName(e.getLesseeName())
                                                                .leaseExpiry(e.getLeaseExpiry())
                                                                .annualRent(e.getAnnualRent())
                                                                .build())
                                                .toList())
                                .otherImmovables(otherImmovRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclImmovOtherResponse.builder()
                                                                .id(e.getId()).description(e.getDescription())
                                                                .area(e.getArea()).valuation(e.getValuation())
                                                                .build())
                                                .toList())
                                .preciousMetals(preciousMetalRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclMovPreciousMetalResponse.builder()
                                                                .id(e.getId()).itemType(e.getItemType())
                                                                .weightGrams(e.getWeightGrams()).purity(e.getPurity())
                                                                .estimatedValue(e.getEstimatedValue())
                                                                .build())
                                                .toList())
                                .artifacts(artifactRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclMovArtifactResponse.builder()
                                                                .id(e.getId()).name(e.getName())
                                                                .description(e.getDescription())
                                                                .estimatedValue(e.getEstimatedValue())
                                                                .storageLocation(e.getStorageLocation())
                                                                .build())
                                                .toList())
                                .vehicles(vehicleRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclMovVehicleResponse.builder()
                                                                .id(e.getId()).vehicleType(e.getVehicleType())
                                                                .registrationNumber(e.getRegistrationNumber())
                                                                .yearOfPurchase(e.getYearOfPurchase())
                                                                .currentValue(e.getCurrentValue())
                                                                .build())
                                                .toList())
                                .equipment(equipmentRepository.findAllByDeclarationId(declarationId)
                                                .stream().map(e -> DeclMovEquipmentResponse.builder()
                                                                .id(e.getId()).description(e.getDescription())
                                                                .quantity(e.getQuantity()).unitValue(e.getUnitValue())
                                                                .totalValue(e.getTotalValue())
                                                                .build())
                                                .toList())
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        @PreAuthorize(RoleConstants.CAN_READ_ALL)
        public ProfileStagingResponse getPendingProfileStaging(Long templeId, ScopeHelper.Claims claims) {
                Temple temple = templeRepository.findWithGeoById(templeId)
                                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
                jurisdictionGuard.assertDistrictScope(temple, claims);

                return profileStagingRepository
                                .findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                                                templeId,
                                                java.util.List.of(
                                                        com.templeregistry.entity.workflow.WorkflowStatus.SUBMITTED,
                                                        com.templeregistry.entity.workflow.WorkflowStatus.UNDER_REVIEW,
                                                        com.templeregistry.entity.workflow.WorkflowStatus.RESUBMITTED))
                                .or(() ->
                                        // Fallback: if no active review exists, return the most recently
                                        // rejected staging so DC can still see what was reviewed.
                                        profileStagingRepository
                                                .findTopByTempleIdAndStatusInOrderByVersionNumberDesc(
                                                        templeId,
                                                        java.util.List.of(
                                                                com.templeregistry.entity.workflow.WorkflowStatus.REJECTED)))
                                .map(this::toProfileStagingResponse)
                                .orElse(null);
        }

        // ─── Mapping helpers ──────────────────────────────────────────────────────

        private TempleResponse toTempleResponse(Temple t) {
                return TempleResponse.builder()
                                .id(t.getId())
                                .registrationNumber(t.getRegistrationNumber())
                                .name(t.getName())
                                .aliasName(t.getAliasName())
                                .grade(t.getGrade())
                                .primaryDeity(t.getPrimaryDeity())
                                .tradition(t.getTradition())
                                .yearEstablished(t.getYearEstablished())
                                .history(t.getHistory())
                                .doorNumber(t.getDoorNumber())
                                .street(t.getStreet())
                                .villageTown(t.getVillageTown())
                                .pinCode(t.getPinCode())
                                .hobliId(t.getHobliId())
                                .talukId(t.getTalukId())
                                .districtId(t.getDistrictId())
                                .latitude(t.getLatitude())
                                .longitude(t.getLongitude())
                                .contactName(t.getContactName())
                                .contactDesignation(t.getContactDesignation())
                                .contactMobile(t.getContactMobile())
                                .contactEmail(t.getContactEmail())
                                .photoUrl(fileStorageService.presignedUrl(t.getPhotoUrl()))
                                .website(t.getWebsite())
                                .languagesOfWorship(t.getLanguagesOfWorship())
                                .linkedInstitutions(t.getLinkedInstitutions())
                                .annualFestivals(t.getAnnualFestivals())
                                .landmark(t.getLandmark())
                                .historicalSignificance(t.getHistoricalSignificance())
                                .bankName(t.getBankName())
                                .bankIfsc(t.getBankIfsc())
                                .trustRegistered(t.isTrustRegistered())
                                .assetDeclarationStatus(t.getAssetDeclarationStatus())
                                .status(t.getStatus() != null ? t.getStatus().name() : null)
                                .verificationStatus(t.getVerificationStatus() != null ? t.getVerificationStatus().name() : null)
                                .dcRejectionReason(t.getDcRejectionReason())
                                .build();
        }

        private TempleFullProfileResponse.DcTrustSummary toTrustSummary(Trust t, ScopeHelper.Claims claims) {
                String[] bankParts = splitBankNameAndBranch(t.getBankNameAndBranch());
                List<TrustFinancial> financials = trustFinancialRepository.findAllByTrustIdOrderByFinancialYearDesc(t.getId());
                // Use canonical WorkflowInstance status — NOT systemVerificationStatus which is never set by approveTrust.
                com.templeregistry.dto.response.governance.GovernanceStatusPayload governancePayload =
                        governanceStatusResolver.resolve(WorkflowEntityType.TRUST, t.getId());
                String workflowStatus = governancePayload.getStatus(); // e.g. SUBMITTED, APPROVED, CLARIFICATION_REQUESTED
                boolean isVerified = "APPROVED".equals(workflowStatus) || "RE_APPROVED".equals(workflowStatus);
                // SEND_BACK action transitions to CLARIFICATION_REQUESTED in the workflow engine
                boolean isSentBack = "CLARIFICATION_REQUESTED".equals(workflowStatus)
                        || "CLARIFICATION_RESPONDED".equals(workflowStatus);
                String dcFlagReasonValue = (isSentBack && t.getSendBackReason() != null) ? t.getSendBackReason() : null;
                String reviewStatus = isVerified ? "APPROVED" : (isSentBack ? "FLAGGED" : "PENDING");
                return TempleFullProfileResponse.DcTrustSummary.builder()
                                .id(t.getId())
                                .trustName(t.getTrustName())
                                .trustType(t.getTrustType() != null ? t.getTrustType().name() : null)
                                .registrationNumber(t.getTrustRegistrationNumber())
                                .registeringAuthority(t.getRegisteringAuthority())
                                .dateOfRegistration(t.getDateOfRegistration())
                                .panNumberMasked(maskPan(t.getTrustPANNumber(), claims.role()))
                                .bankAccountMasked(maskBankAccount(t.getBankAccountNumber()))
                                .bankName(bankParts[0])
                                .bankBranch(bankParts[1])
                                .annualIncome(t.getAnnualIncome())
                                .dcFlagReason(dcFlagReasonValue)
                                .governanceStatus(governancePayload)
                                .reviewStatus(reviewStatus)
                                .workflowStatus(workflowStatus)
                                .isVerifiedByDc(isVerified)
                                .validationIssues(buildTrustValidationIssues(t))
                                .financialStatus(financials.isEmpty() ? "MISSING" : "SUBMITTED")
                                .build();
        }

        /**
         * PAN masking: AB*****1Z for DC/DC_STAFF; unmasked for SUPER_ADMIN.
         * The stored value is encrypted; we get the plaintext from the entity
         * (decrypted via @Convert).
         */
        private String maskPan(String pan, String role) {
                if (pan == null)
                        return null;
                if (RoleConstants.SUPER_ADMIN.equals(role))
                        return pan;
                if (pan.length() < 2)
                        return "**";
                return pan.substring(0, 2) + "*****" + pan.charAt(pan.length() - 1);
        }

        /**
         * Bank account masking: always **XXXXX{last4} for all roles.
         * Robust against null/empty/whitespace.
         */
        private String maskBankAccount(String account) {
                if (account == null || account.trim().isBlank())
                        return null;
                String trimmed = account.trim();
                if (trimmed.length() <= 4)
                        return "****";
                return "**XXXXX" + trimmed.substring(trimmed.length() - 4);
        }

        private TempleFullProfileResponse.BoardMemberSummary toBoardMemberResponse(BoardMember m) {
                return TempleFullProfileResponse.BoardMemberSummary.builder()
                                .id(m.getId())
                                .fullName(m.getFullName())
                                .maskedAadhaar(m.getMaskedAadhaar())
                                .designation(m.getDesignation())
                                .appointmentDate(m.getAppointmentDate())
                                .tenureEndDate(m.getTenureEndDate())
                                .contactNumber(m.getContactNumber())
                                .address(m.getAddress())
                                .current(trustValidationService.isCurrentMember(m.getTenureEndDate()))
                                .dcFlagReason(null)
                                .build();
        }

        private TempleFullProfileResponse.TrustFinancialSummary toFinancialSummary(TrustFinancial f) {
                return TempleFullProfileResponse.TrustFinancialSummary.builder()
                                .financialYear(f.getFinancialYear())
                                .annualIncome(f.getAnnualIncome())
                                .annualExpenditure(f.getAnnualExpenditure())
                                .build();
        }

        private TempleFullProfileResponse.BoardMeetingSummary toBoardMeetingSummary(BoardMeeting m) {
                return TempleFullProfileResponse.BoardMeetingSummary.builder()
                                .id(m.getId())
                                .meetingDate(m.getMeetingDate())
                                .agenda(m.getAgenda())
                                .minutesDocumentId(m.getMinutesDocumentId())
                                .createdAt(m.getCreatedAt())
                                .build();
        }

        private EmployeeResponse toEmployeeResponse(Employee e) {
                return EmployeeResponse.builder()
                                .id(e.getId())
                                .templeId(e.getTempleId())
                                .employeeRef(e.getEmployeeRef())
                                .fullName(e.getFullName())
                                .employeeType(e.getEmployeeType())
                                .designation(e.getDesignation())
                                .dateOfJoining(e.getDateOfJoining())
                                .salaryGrade(e.getSalaryGrade())
                                .mobile(e.getMobile())
                                .address(e.getAddress())
                                .status(e.getStatus())
                                .hereditary(e.getHereditary())
                                .build();
        }

        private ContractorResponse toContractorResponse(Contractor c) {
                return ContractorResponse.builder()
                                .id(c.getId())
                                .templeId(c.getTempleId())
                                .companyName(c.getCompanyName())
                                .gstNumber(c.getGstNumber())
                                .serviceType(c.getServiceType())
                                .contractReference(c.getContractReference())
                                .workOrderDate(c.getWorkOrderDate())
                                .contractStartDate(c.getContractStartDate())
                                .contractEndDate(c.getContractEndDate())
                                .contractValue(c.getContractValue())
                                .paymentStatus(c.getPaymentStatus())
                                .documentIds(c.getDocumentIdList())
                                .build();
        }

        private DeclarationResponse toDeclarationResponse(AssetDeclaration d) {
                return DeclarationResponse.builder()
                                .id(d.getId())
                                .templeId(d.getTempleId())
                                .districtId(d.getDistrictId())
                                .status(d.getStatus())
                                .agriculturalLandAcres(d.getAgriculturalLandAcres())
                                .agriculturalLandValue(d.getAgriculturalLandValue())
                                .buildingsSqft(d.getBuildingsSqft())
                                .buildingsValue(d.getBuildingsValue())
                                .leasedPropertiesCount(d.getLeasedPropertiesCount())
                                .leasedPropertiesValue(d.getLeasedPropertiesValue())
                                .otherLandValue(d.getOtherLandValue())
                                .goldGrams(d.getGoldGrams())
                                .silverGrams(d.getSilverGrams())
                                .idolsCount(d.getIdolsCount())
                                .vehiclesCount(d.getVehiclesCount())
                                .financialAssetsValue(d.getFinancialAssetsValue())
                                .otherMovableValue(d.getOtherMovableValue())
                                .submittedAt(d.getSubmittedAt())
                                .reviewedAt(d.getReviewedAt())
                                .acknowledgementNumber(d.getAcknowledgementNumber())
                                .dueDate(d.getDueDate())
                                .governanceStatus(governanceStatusResolver.resolve(
                                    WorkflowEntityType.DECLARATION, d.getId()))
                                .build();
        }

        private TempleFullProfileResponse.ProfileCurrentResponse toProfileCurrentResponse(TempleProfileCurrent p) {
                return TempleFullProfileResponse.ProfileCurrentResponse.builder()
                                .phone(p.getPhone())
                                .email(p.getEmail())
                                .website(p.getWebsite())
                                .contactPersonName(p.getContactPersonName())
                                .contactPersonDesignation(p.getContactPersonDesignation())
                                .photoUrl(fileStorageService.presignedUrl(p.getPhotoFilePath()))
                                .bankName(p.getBankName())
                                .bankAccountMasked(maskBankAccount(p.getBankAccountNumberEncrypted()))
                                .bankIfsc(p.getBankIfsc())
                                .languagesOfWorship(p.getLanguagesOfWorship())
                                .linkedInstitutions(p.getLinkedInstitutions())
                                .description(p.getDescription())
                                .annualFestivals(p.getAnnualFestivals())
                                .landmark(p.getLandmark())
                                .historicalSignificance(p.getHistoricalSignificance())
                                .build();
        }

        private ClarificationItemResponse toClarificationResponse(DeclarationClarification c) {
                return ClarificationItemResponse.builder()
                                .id(c.getId())
                                .direction(c.getDirection().name())
                                .message(c.getMessage())
                                .sectionName(c.getSectionName())
                                .fieldNamesJson(c.getFieldNamesJson())
                                .authorId(c.getAuthorId())
                                .createdAt(c.getCreatedAt())
                                .build();
        }

        private ProfileStagingResponse toProfileStagingResponse(TempleProfileStaging s) {
                WorkflowInstance instance = workflowEngine.getState(WorkflowEntityType.TEMPLE_PROFILE, s.getId());
                return ProfileStagingResponse.builder()
                                .id(s.getId())
                                .templeId(s.getTempleId())
                                .version(instance.getVersionNumber())
                                .status(instance.getStatus().name())
                                .governanceStatus(governanceStatusResolver.resolve(WorkflowEntityType.TEMPLE_PROFILE, s.getId()))
                                .contactPersonName(s.getContactPersonName())
                                .contactPersonDesignation(s.getContactPersonDesignation())
                                .phone(s.getPhone())
                                .email(s.getEmail())
                                .photoUrl(fileStorageService.presignedUrl(s.getPhotoFilePath()))
                                .bankName(s.getBankName())
                                .bankAccountNumberMasked(maskBankAccount(s.getBankAccountNumberEncrypted()))
                                .bankIfsc(s.getBankIfsc())
                                .languagesOfWorship(s.getLanguagesOfWorship())
                                .linkedInstitutions(s.getLinkedInstitutions())
                                .description(s.getDescription())
                                .annualFestivals(s.getAnnualFestivals())
                                .landmark(s.getLandmark())
                                .historicalSignificance(s.getHistoricalSignificance())
                                .submittedAt(instance.getSubmittedAt() != null ? java.time.LocalDateTime.ofInstant(instance.getSubmittedAt(), java.time.ZoneId.systemDefault()) : null)
                                .submittedBy(instance.getCreatedBy())
                                .build();
        }

        private List<String> buildTrustValidationIssues(Trust trust) {
                return Stream.of(
                                trust.getDateOfRegistration() != null && trust.getDateOfRegistration().isAfter(java.time.LocalDate.now())
                                                ? "Registration date is in the future" : null,
                                isBlank(trust.getRegisteringAuthority()) ? "Registering authority is missing" : null,
                                isBlank(trust.getTrustPANNumber()) ? "PAN is missing" : null,
                                isBlank(trust.getBankAccountNumber()) ? "Bank account number is missing" : null,
                                isBlank(splitBankNameAndBranch(trust.getBankNameAndBranch())[1]) ? "Bank branch is missing" : null)
                                .filter(Objects::nonNull)
                                .toList();
        }

        private List<String> buildBoardMemberValidationIssues(List<TempleFullProfileResponse.BoardMemberSummary> members) {
                long missingAddress = members.stream().filter(member -> isBlank(member.getAddress())).count();
                if (missingAddress == 0) {
                        return List.of();
                }
                return List.of(missingAddress + " board member record(s) are missing address details.");
        }

        private String[] splitBankNameAndBranch(String bankNameAndBranch) {
                if (bankNameAndBranch == null || bankNameAndBranch.isBlank()) {
                        return new String[] {null, null};
                }
                String[] parts = bankNameAndBranch.split("\\|\\|", 2);
                if (parts.length == 2) {
                        return parts;
                }
                return new String[] {bankNameAndBranch, null};
        }

        private boolean isBlank(String value) {
                return value == null || value.trim().isBlank();
        }
}
