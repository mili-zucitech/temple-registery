package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.CreateBoardMemberRequest;
import com.templeregistry.dto.request.trust.CreateBoardMeetingRequest;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.SubmitTrustFinancialRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.Trust;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.service.trust.TrustValidationService;
import com.templeregistry.util.HmacUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TrustValidationServiceImpl implements TrustValidationService {

    private static final Pattern PAN_PATTERN = Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[6-9][0-9]{9}$");
    private static final Pattern BANK_ACCOUNT_PATTERN = Pattern.compile("^[0-9]{6,32}$");
    private static final Pattern FY_PATTERN = Pattern.compile("^\\d{4}-\\d{2}$");

    private final TrustRepository trustRepository;
    private final BoardMemberRepository boardMemberRepository;
    private final TrustFinancialRepository trustFinancialRepository;
    private final HmacUtil hmacUtil;

    @Override
    public void validateTrustRequest(CreateTrustRequest request, Long existingTrustId) {
        if (request.getDateOfRegistration() != null && request.getDateOfRegistration().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Date of registration cannot be in the future.");
        }
        requireText(request.getRegisteringAuthority(), "Registering authority is required.");
        requireText(request.getPanNumber(), "PAN is required.");
        requireText(request.getBankAccountNumber(), "Bank account number is required.");
        requireText(request.getBankName(), "Bank name is required.");
        requireText(request.getBankBranch(), "Bank branch is required.");

        String normalizedPan = request.getPanNumber().trim().toUpperCase(Locale.ROOT);
        if (!PAN_PATTERN.matcher(normalizedPan).matches()) {
            throw new IllegalArgumentException("PAN format is invalid.");
        }
        if (!BANK_ACCOUNT_PATTERN.matcher(request.getBankAccountNumber().trim()).matches()) {
            throw new IllegalArgumentException("Bank account number must contain only digits.");
        }

        trustRepository.findByTrustRegistrationNumberIgnoreCase(request.getRegistrationNumber().trim())
                .filter(existing -> !existing.getId().equals(existingTrustId))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("Trust registration number already exists.");
                });

    }

    @Override
    public void validateBoardMemberCreate(Long trustId, CreateBoardMemberRequest request) {
        validateBoardMemberFields(request.getAppointmentDate(), request.getTenureEndDate(),
                request.getContactNumber(), request.getAddress(), request.getAadhaarNumber());
        if (request.getAadhaarNumber() != null) {
            assertUniqueAadhaar(trustId, request.getAadhaarNumber(), null);
        }
    }

    @Override
    public void validateBoardMemberUpdate(Long trustId, BoardMember member, UpdateBoardMemberRequest request) {
        LocalDate appointmentDate = request.getAppointmentDate() != null ? request.getAppointmentDate() : member.getAppointmentDate();
        LocalDate tenureEndDate = request.getTenureEndDate() != null ? request.getTenureEndDate() : member.getTenureEndDate();
        String contact = request.getContactNumber() != null ? request.getContactNumber() : member.getContactNumber();
        String address = request.getAddress() != null ? request.getAddress() : member.getAddress();

        validateBoardMemberFields(appointmentDate, tenureEndDate, contact, address, null);
    }

    @Override
    public void validateFinancialRequest(Long trustId, SubmitTrustFinancialRequest request) {
        if (!FY_PATTERN.matcher(request.getFinancialYear().trim()).matches()) {
            throw new IllegalArgumentException("Financial year must be in YYYY-YY format.");
        }
        validateMoney(request.getAnnualIncome(), "Annual income");
        validateMoney(request.getAnnualExpenditure(), "Annual expenditure");
        if (request.getAnnualIncome() == null && request.getAnnualExpenditure() == null && request.getDocumentId() == null) {
            throw new IllegalArgumentException("At least one financial value or supporting document is required.");
        }
        if (trustFinancialRepository.existsByTrustIdAndFinancialYear(trustId, request.getFinancialYear().trim())) {
            throw new DuplicateResourceException("A financial record for this year already exists.");
        }
    }

    @Override
    public void validateBoardMeetingRequest(CreateBoardMeetingRequest request) {
        if (request.getMeetingDate() != null && request.getMeetingDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Meeting date cannot be in the future.");
        }
    }

    @Override
    public boolean isCurrentMember(LocalDate tenureEndDate) {
        return tenureEndDate == null || !tenureEndDate.isBefore(LocalDate.now());
    }

    private void validateBoardMemberFields(LocalDate appointmentDate,
                                           LocalDate tenureEndDate,
                                           String contactNumber,
                                           String address,
                                           String aadhaar) {
        if (appointmentDate == null) {
            throw new IllegalArgumentException("Appointment date is required.");
        }
        if (appointmentDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Appointment date cannot be in the future.");
        }
        if (tenureEndDate != null && !tenureEndDate.isAfter(appointmentDate)) {
            throw new IllegalArgumentException("Tenure end date must be after appointment date.");
        }
        requireText(address, "Address is required.");
        if (contactNumber != null && !contactNumber.isBlank() && !PHONE_PATTERN.matcher(contactNumber.trim()).matches()) {
            throw new IllegalArgumentException("Phone number must be a valid 10-digit Indian mobile number.");
        }
        if (aadhaar != null && !aadhaar.isBlank() && !aadhaar.matches("^\\d{12}$")) {
            throw new IllegalArgumentException("Aadhaar must be 12 digits.");
        }
    }

    private void assertUniqueAadhaar(Long trustId, String aadhaar, Long memberId) {
        String hash = hmacUtil.hash(aadhaar);
        boardMemberRepository.findByTrustIdAndAadhaarHash(trustId, hash)
                .filter(existing -> !existing.getId().equals(memberId))
                .ifPresent(existing -> {
                    throw new DuplicateResourceException("A board member with this Aadhaar already exists for the trust.");
                });
    }

    private void validateMoney(BigDecimal value, String label) {
        if (value != null && value.signum() < 0) {
            throw new IllegalArgumentException(label + " must be zero or positive.");
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.trim().isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }
}
