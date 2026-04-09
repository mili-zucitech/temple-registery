package com.templeregistry.service.impl.dc;

import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.dto.response.dc.*;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import com.templeregistry.entity.contractor.Contractor;
import com.templeregistry.entity.dc.TempleProfileCurrent;
import com.templeregistry.entity.dc.TempleProfileStaging;
import com.templeregistry.entity.dc.ProfileStagingStatus;
import com.templeregistry.entity.declaration.AssetDeclaration;
import com.templeregistry.entity.declaration.ClarificationDirection;
import com.templeregistry.entity.declaration.DeclarationClarification;
import com.templeregistry.entity.employee.Employee;
import com.templeregistry.entity.geo.City;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.temple.TempleSearchSummary;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.TrustFinancial;
import com.templeregistry.entity.trust.TrustRegistration;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.contractor.ContractorRepository;
import com.templeregistry.repository.dc.*;
import com.templeregistry.repository.declaration.DeclarationClarificationRepository;
import com.templeregistry.repository.declaration.DeclarationRepository;
import com.templeregistry.repository.employee.EmployeeRepository;
import com.templeregistry.repository.geo.CityRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.temple.TempleSearchSummaryRepository;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.RoleConstants;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.dc.DcTempleProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DcTempleProfileServiceImpl implements DcTempleProfileService {

    private final TempleRepository templeRepository;
    private final TempleSearchSummaryRepository summaryRepository;
    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
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

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public TempleFullProfileResponse getFullProfile(Long templeId, ScopeHelper.Claims claims) {
        Temple temple = templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        jurisdictionGuard.assertDistrictScope(temple, claims);

        // Geo names from eagerly loaded chain
        String hobliName    = temple.getHobli() != null ? temple.getHobli().getName() : null;
        String talukName    = (temple.getHobli() != null && temple.getHobli().getTaluk() != null)
                ? temple.getHobli().getTaluk().getName() : null;
        String districtName = (temple.getHobli() != null && temple.getHobli().getTaluk() != null
                && temple.getHobli().getTaluk().getDistrict() != null)
                ? temple.getHobli().getTaluk().getDistrict().getName() : null;

        // City name via summary (has denormalized cityId)
        String cityName = summaryRepository.findByTempleId(templeId)
                .flatMap(s -> cityRepository.findById(s.getCityId()))
                .map(City::getName)
                .orElse(null);

        // Trust (use the first active trust registration)
        List<TrustRegistration> trusts = trustRepository.findAllByTempleId(templeId);
        TrustRegistration primaryTrust = trusts.isEmpty() ? null : trusts.get(0);

        TempleFullProfileResponse.DcTrustSummary trustSummary = null;
        List<BoardMemberResponse> boardMembers    = List.of();
        List<TempleFullProfileResponse.TrustFinancialSummary> financials = List.of();

        if (primaryTrust != null) {
            trustSummary = toTrustSummary(primaryTrust, claims);
            boardMembers = boardMemberRepository.findAllByTrustIdAndIsCurrent(primaryTrust.getId(), true)
                    .stream().map(this::toBoardMemberResponse).toList();
            financials = trustFinancialRepository
                    .findAllByTrustIdOrderByFinancialYearDesc(primaryTrust.getId())
                    .stream().map(this::toFinancialSummary).toList();
        }

        // Employees (max 100 for DC view)
        List<EmployeeResponse> employees = employeeRepository
                .findAllByTempleId(templeId, PageRequest.of(0, 100))
                .stream().map(this::toEmployeeResponse).toList();

        // Contractors (max 100 for DC view)
        List<ContractorResponse> contractors = contractorRepository
                .findAllByTempleId(templeId, PageRequest.of(0, 100))
                .stream().map(this::toContractorResponse).toList();

        // Declarations (most recent 10)
        List<DeclarationResponse> declarations = declarationRepository
                .findAllByTempleId(templeId, PageRequest.of(0, 10))
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
                                .encumbrance(e.getEncumbrance()).annualLeaseIncome(e.getAnnualLeaseIncome())
                                .build()).toList())
                .buildings(buildingRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclImmovBuildingResponse.builder()
                                .id(e.getId()).structureType(e.getStructureType())
                                .areaSqft(e.getAreaSqft()).conditionText(e.getConditionText())
                                .valuation(e.getValuation())
                                .build()).toList())
                .leasedProperties(leasedRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclImmovLeasedResponse.builder()
                                .id(e.getId()).lesseeName(e.getLesseeName())
                                .leaseExpiry(e.getLeaseExpiry()).annualRent(e.getAnnualRent())
                                .build()).toList())
                .otherImmovables(otherImmovRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclImmovOtherResponse.builder()
                                .id(e.getId()).description(e.getDescription())
                                .area(e.getArea()).valuation(e.getValuation())
                                .build()).toList())
                .preciousMetals(preciousMetalRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclMovPreciousMetalResponse.builder()
                                .id(e.getId()).itemType(e.getItemType())
                                .weightGrams(e.getWeightGrams()).purity(e.getPurity())
                                .estimatedValue(e.getEstimatedValue())
                                .build()).toList())
                .artifacts(artifactRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclMovArtifactResponse.builder()
                                .id(e.getId()).name(e.getName()).description(e.getDescription())
                                .estimatedValue(e.getEstimatedValue()).storageLocation(e.getStorageLocation())
                                .build()).toList())
                .vehicles(vehicleRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclMovVehicleResponse.builder()
                                .id(e.getId()).vehicleType(e.getVehicleType())
                                .registrationNumber(e.getRegistrationNumber())
                                .yearOfPurchase(e.getYearOfPurchase()).currentValue(e.getCurrentValue())
                                .build()).toList())
                .equipment(equipmentRepository.findAllByDeclarationId(declarationId)
                        .stream().map(e -> DeclMovEquipmentResponse.builder()
                                .id(e.getId()).description(e.getDescription())
                                .quantity(e.getQuantity()).unitValue(e.getUnitValue())
                                .totalValue(e.getTotalValue())
                                .build()).toList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize(RoleConstants.CAN_READ_ALL)
    public ProfileStagingResponse getPendingProfileStaging(Long templeId, ScopeHelper.Claims claims) {
        Temple temple = templeRepository.findWithGeoById(templeId)
                .orElseThrow(() -> new EntityNotFoundException("Temple", templeId));
        jurisdictionGuard.assertDistrictScope(temple, claims);

        TempleProfileStaging staging = profileStagingRepository
                .findTopByTempleIdAndStatusOrderByVersionDesc(templeId, ProfileStagingStatus.PENDING_REVIEW)
                .orElseThrow(() -> new EntityNotFoundException(
                        "TempleProfileStaging", "No pending profile review found for temple " + templeId));

        return toProfileStagingResponse(staging);
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
                .photoUrl(t.getPhotoUrl())
                .languagesOfWorship(t.getLanguagesOfWorship())
                .trustRegistered(t.isTrustRegistered())
                .assetDeclarationStatus(t.getAssetDeclarationStatus())
                .build();
    }

    private TempleFullProfileResponse.DcTrustSummary toTrustSummary(TrustRegistration t,
                                                                      ScopeHelper.Claims claims) {
        String maskedPan = maskPan(t.getPanNumberEncrypted(), claims.role());
        String maskedBank = maskBankAccount(t.getBankAccountNumberEncrypted());

        return TempleFullProfileResponse.DcTrustSummary.builder()
                .id(t.getId())
                .trustName(t.getTrustName())
                .trustType(t.getTrustType() != null ? t.getTrustType().name() : null)
                .registrationNumber(t.getRegistrationNumber())
                .registeringAuthority(t.getRegisteringAuthority())
                .dateOfRegistration(t.getDateOfRegistration())
                .panNumberMasked(maskedPan)
                .bankAccountMasked(maskedBank)
                .bankName(t.getBankName())
                .bankBranch(t.getBankBranch())
                .annualIncome(t.getAnnualIncome())
                .build();
    }

    /**
     * PAN masking: AB*****1Z for DC/DC_STAFF; unmasked for SUPER_ADMIN.
     * The stored value is encrypted; we get the plaintext from the entity (decrypted via @Convert).
     */
    private String maskPan(String pan, String role) {
        if (pan == null) return null;
        if (RoleConstants.SUPER_ADMIN.equals(role)) return pan;
        if (pan.length() < 2) return "**";
        return pan.substring(0, 2) + "*****" + pan.charAt(pan.length() - 1);
    }

    /**
     * Bank account masking: always **XXXXX{last4} for all roles.
     */
    private String maskBankAccount(String account) {
        if (account == null) return null;
        if (account.length() <= 4) return "****";
        return "**XXXXX" + account.substring(account.length() - 4);
    }

    private BoardMemberResponse toBoardMemberResponse(BoardMember m) {
        String maskedAadhaar = m.getAadhaarEncrypted() != null && m.getAadhaarEncrypted().length() >= 4
                ? "XXXX-XXXX-" + m.getAadhaarEncrypted().substring(m.getAadhaarEncrypted().length() - 4)
                : null;
        return BoardMemberResponse.builder()
                .id(m.getId())
                .trustId(m.getTrustId())
                .fullName(m.getFullName())
                .aadhaarMasked(maskedAadhaar)
                .designation(m.getDesignation())
                .appointmentDate(m.getAppointmentDate())
                .tenureEndDate(m.getTenureEndDate())
                .contactNumber(m.getContactNumber())
                .isCurrent(m.isCurrent())
                .build();
    }

    private TempleFullProfileResponse.TrustFinancialSummary toFinancialSummary(TrustFinancial f) {
        return TempleFullProfileResponse.TrustFinancialSummary.builder()
                .financialYear(f.getFinancialYear())
                .annualIncome(f.getAnnualIncome())
                .annualExpenditure(f.getAnnualExpenditure())
                .build();
    }

    private EmployeeResponse toEmployeeResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .templeId(e.getTempleId())
                .fullName(e.getFullName())
                .employeeType(e.getEmployeeType())
                .designation(e.getDesignation())
                .dateOfJoining(e.getDateOfJoining())
                .salaryGrade(e.getSalaryGrade())
                .status(e.getStatus())
                .isHereditary(e.isHereditary())
                .build();
    }

    private ContractorResponse toContractorResponse(Contractor c) {
        return ContractorResponse.builder()
                .id(c.getId())
                .templeId(c.getTempleId())
                .name(c.getName())
                .gstNumber(c.getGstNumber())
                .serviceType(c.getServiceType())
                .contractReference(c.getContractReference())
                .workOrderDate(c.getWorkOrderDate())
                .contractStartDate(c.getContractStartDate())
                .contractEndDate(c.getContractEndDate())
                .contractValue(c.getContractValue())
                .paymentStatus(c.getPaymentStatus())
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
                .build();
    }

    private TempleFullProfileResponse.ProfileCurrentResponse toProfileCurrentResponse(TempleProfileCurrent p) {
        return TempleFullProfileResponse.ProfileCurrentResponse.builder()
                .contactPersonName(p.getContactPersonName())
                .contactPersonDesignation(p.getContactPersonDesignation())
                .photoFilePath(p.getPhotoFilePath())
                .languagesOfWorship(p.getLanguagesOfWorship())
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
                .authorId(c.getAuthorId())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ProfileStagingResponse toProfileStagingResponse(TempleProfileStaging s) {
        return ProfileStagingResponse.builder()
                .id(s.getId())
                .templeId(s.getTempleId())
                .version(s.getVersion())
                .status(s.getStatus().name())
                .contactPersonName(s.getContactPersonName())
                .contactPersonDesignation(s.getContactPersonDesignation())
                .photoFilePath(s.getPhotoFilePath())
                .languagesOfWorship(s.getLanguagesOfWorship())
                .annualFestivals(s.getAnnualFestivals())
                .landmark(s.getLandmark())
                .historicalSignificance(s.getHistoricalSignificance())
                .submittedAt(s.getSubmittedAt())
                .submittedBy(s.getSubmittedBy())
                .reviewedAt(s.getReviewedAt())
                .reviewedBy(s.getReviewedBy())
                .reviewComment(s.getReviewComment())
                .build();
    }
}
