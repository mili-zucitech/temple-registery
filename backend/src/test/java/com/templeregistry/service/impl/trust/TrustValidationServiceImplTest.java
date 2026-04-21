package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.CreateBoardMemberRequest;
import com.templeregistry.dto.request.trust.CreateBoardMeetingRequest;
import com.templeregistry.dto.request.trust.CreateTrustRequest;
import com.templeregistry.dto.request.trust.SubmitTrustFinancialRequest;
import com.templeregistry.dto.request.trust.UpdateBoardMemberRequest;
import com.templeregistry.entity.trust.BoardMember;
import com.templeregistry.entity.trust.TrustType;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.repository.trust.BoardMemberRepository;
import com.templeregistry.repository.trust.TrustFinancialRepository;
import com.templeregistry.repository.trust.TrustRepository;
import com.templeregistry.util.HmacUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TrustValidationServiceImpl.
 * Proves all business rules are enforced before any DB write.
 */
@ExtendWith(MockitoExtension.class)
class TrustValidationServiceImplTest {

    @Mock TrustRepository trustRepository;
    @Mock BoardMemberRepository boardMemberRepository;
    @Mock TrustFinancialRepository trustFinancialRepository;
    @Mock HmacUtil hmacUtil;

    @InjectMocks TrustValidationServiceImpl sut;

    // ─── Trust Request Validation ─────────────────────────────────────────────

    @Nested
    class TrustRequestValidation {

        private CreateTrustRequest validRequest() {
            return CreateTrustRequest.builder()
                    .trustName("Sri Rama Trust")
                    .trustType(TrustType.MULTI_TRUSTEE)
                    .registrationNumber("TR001")
                    .registeringAuthority("Sub-Registrar Office")
                    .dateOfRegistration(LocalDate.now().minusDays(1))
                    .panNumber("ABCDE1234F")
                    .bankAccountNumber("123456789012")
                    .bankName("SBI")
                    .bankBranch("Main Branch")
                    .build();
        }

        @Test
        void valid_request_passes_without_exception() {
            when(trustRepository.findByTrustRegistrationNumberIgnoreCase(anyString()))
                    .thenReturn(Optional.empty());
            assertThatNoException().isThrownBy(() -> sut.validateTrustRequest(validRequest(), null));
        }

        @Test
        void future_registration_date_is_rejected() {
            CreateTrustRequest rq = validRequest();
            rq.setDateOfRegistration(LocalDate.now().plusDays(1));
            assertThatThrownBy(() -> sut.validateTrustRequest(rq, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("future");
        }

        @ParameterizedTest(name = "invalid PAN: {0}")
        @ValueSource(strings = {"ABCDE123", "12345ABCDE", "ABCDE12345", "ABCDE123FF"})
        void invalid_pan_formats_are_rejected(String pan) {
            CreateTrustRequest rq = validRequest();
            rq.setPanNumber(pan);
            assertThatThrownBy(() -> sut.validateTrustRequest(rq, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("PAN");
        }

        @Test
        void valid_pan_passes() {
            when(trustRepository.findByTrustRegistrationNumberIgnoreCase(anyString()))
                    .thenReturn(Optional.empty());
            CreateTrustRequest rq = validRequest();
            rq.setPanNumber("ABCDE1234F");
            assertThatNoException().isThrownBy(() -> sut.validateTrustRequest(rq, null));
        }

        @ParameterizedTest(name = "invalid bank account: {0}")
        @ValueSource(strings = {"12345", "abcdef123456", "123 456 789"})
        void invalid_bank_account_formats_are_rejected(String account) {
            CreateTrustRequest rq = validRequest();
            rq.setBankAccountNumber(account);
            assertThatThrownBy(() -> sut.validateTrustRequest(rq, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Bank account");
        }

        @Test
        void duplicate_registration_number_is_rejected() {
            CreateTrustRequest rq = validRequest();
            com.templeregistry.entity.trust.Trust existing =
                    com.templeregistry.entity.trust.Trust.builder().build();
            // Simulate existing trust with id=99 (different from null → duplicate)
            org.springframework.test.util.ReflectionTestUtils.setField(existing, "id", 99L);
            when(trustRepository.findByTrustRegistrationNumberIgnoreCase("TR001"))
                    .thenReturn(Optional.of(existing));
            assertThatThrownBy(() -> sut.validateTrustRequest(rq, null))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("registration number");
        }

        @Test
        void same_registration_number_on_update_of_same_trust_passes() {
            CreateTrustRequest rq = validRequest();
            com.templeregistry.entity.trust.Trust existing =
                    com.templeregistry.entity.trust.Trust.builder().build();
            org.springframework.test.util.ReflectionTestUtils.setField(existing, "id", 1L);
            when(trustRepository.findByTrustRegistrationNumberIgnoreCase("TR001"))
                    .thenReturn(Optional.of(existing));
            // existingTrustId = 1L matches the found trust → not a duplicate
            assertThatNoException().isThrownBy(() -> sut.validateTrustRequest(rq, 1L));
        }

        @Test
        void missing_registering_authority_is_rejected() {
            CreateTrustRequest rq = validRequest();
            rq.setRegisteringAuthority("  ");
            assertThatThrownBy(() -> sut.validateTrustRequest(rq, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("authority");
        }
    }

    // ─── Board Member Validation ──────────────────────────────────────────────

    @Nested
    class BoardMemberValidation {

        private CreateBoardMemberRequest validMemberRequest() {
            CreateBoardMemberRequest rq = new CreateBoardMemberRequest();
            rq.setFullName("Govinda Rao");
            rq.setAadhaarNumber("123456789012");
            rq.setDesignation("Trustee");
            rq.setAppointmentDate(LocalDate.now().minusDays(10));
            rq.setContactNumber("9876543210");
            rq.setAddress("123 Temple Street, Mysuru");
            return rq;
        }

        @Test
        void valid_member_passes() {
            when(hmacUtil.hash("123456789012")).thenReturn("somehash");
            when(boardMemberRepository.findByTrustIdAndAadhaarHash(1L, "somehash"))
                    .thenReturn(Optional.empty());
            assertThatNoException().isThrownBy(() -> sut.validateBoardMemberCreate(1L, validMemberRequest()));
        }

        @Test
        void null_appointment_date_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setAppointmentDate(null);
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Appointment date");
        }

        @Test
        void future_appointment_date_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setAppointmentDate(LocalDate.now().plusDays(1));
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("future");
        }

        @Test
        void tenure_end_before_appointment_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setAppointmentDate(LocalDate.now().minusDays(5));
            rq.setTenureEndDate(LocalDate.now().minusDays(10)); // before appointment
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Tenure end date");
        }

        @Test
        void tenure_end_same_as_appointment_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            LocalDate date = LocalDate.now().minusDays(5);
            rq.setAppointmentDate(date);
            rq.setTenureEndDate(date); // same day — must be strictly after
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Tenure end date");
        }

        @Test
        void duplicate_aadhaar_within_same_trust_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            BoardMember existing = BoardMember.builder().trustId(1L).build();
            org.springframework.test.util.ReflectionTestUtils.setField(existing, "id", 5L);
            when(hmacUtil.hash("123456789012")).thenReturn("aadhaar-hash-abc");
            when(boardMemberRepository.findByTrustIdAndAadhaarHash(1L, "aadhaar-hash-abc"))
                    .thenReturn(Optional.of(existing));
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("Aadhaar");
        }

        @ParameterizedTest(name = "invalid Aadhaar: {0}")
        @ValueSource(strings = {"12345678901", "1234567890123", "abcdefghijkl", "123 456 789 012"})
        void invalid_aadhaar_formats_are_rejected(String aadhaar) {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setAadhaarNumber(aadhaar);
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Aadhaar");
        }

        @Test
        void blank_address_is_rejected() {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setAddress("  ");
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Address");
        }

        @ParameterizedTest(name = "invalid phone: {0}")
        @ValueSource(strings = {"1234567890", "98765432", "abcdefghij"})
        void invalid_phone_numbers_are_rejected(String phone) {
            CreateBoardMemberRequest rq = validMemberRequest();
            rq.setContactNumber(phone);
            assertThatThrownBy(() -> sut.validateBoardMemberCreate(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("mobile");
        }
    }

    // ─── Financial Validation ─────────────────────────────────────────────────

    @Nested
    class FinancialValidation {

        @Test
        void valid_financial_request_passes() {
            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2024-25");
            rq.setAnnualIncome(BigDecimal.valueOf(500000));
            when(trustFinancialRepository.existsByTrustIdAndFinancialYear(1L, "2024-25"))
                    .thenReturn(false);
            assertThatNoException().isThrownBy(() -> sut.validateFinancialRequest(1L, rq));
        }

        @Test
        void duplicate_financial_year_is_rejected() {
            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2023-24");
            rq.setAnnualIncome(BigDecimal.valueOf(100000));
            when(trustFinancialRepository.existsByTrustIdAndFinancialYear(1L, "2023-24"))
                    .thenReturn(true);
            assertThatThrownBy(() -> sut.validateFinancialRequest(1L, rq))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("already exists");
        }

        @ParameterizedTest(name = "invalid FY format: {0}")
        @ValueSource(strings = {"2024", "24-25", "2024/25", "FY2024"})
        void invalid_financial_year_format_is_rejected(String fy) {
            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear(fy);
            rq.setAnnualIncome(BigDecimal.ONE);
            assertThatThrownBy(() -> sut.validateFinancialRequest(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("YYYY-YY");
        }

        @Test
        void negative_income_is_rejected() {
            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2024-25");
            rq.setAnnualIncome(BigDecimal.valueOf(-1));
            assertThatThrownBy(() -> sut.validateFinancialRequest(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("income");
        }

        @Test
        void all_null_values_without_document_is_rejected() {
            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2024-25");
            // annualIncome, annualExpenditure, documentId all null
            // No stubbing needed — the validation throws before hitting the repository
            assertThatThrownBy(() -> sut.validateFinancialRequest(1L, rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("financial value");
        }
    }

    // ─── Meeting Validation ───────────────────────────────────────────────────

    @Nested
    class MeetingValidation {

        @Test
        void future_meeting_date_is_rejected() {
            CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                    .meetingDate(LocalDate.now().plusDays(1))
                    .build();
            assertThatThrownBy(() -> sut.validateBoardMeetingRequest(rq))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("future");
        }

        @Test
        void today_meeting_date_is_accepted() {
            CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                    .meetingDate(LocalDate.now())
                    .build();
            assertThatNoException().isThrownBy(() -> sut.validateBoardMeetingRequest(rq));
        }

        @Test
        void past_meeting_date_is_accepted() {
            CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                    .meetingDate(LocalDate.now().minusDays(30))
                    .build();
            assertThatNoException().isThrownBy(() -> sut.validateBoardMeetingRequest(rq));
        }
    }

    // ─── isCurrentMember logic ────────────────────────────────────────────────

    @Nested
    class IsCurrentMemberLogic {

        @Test
        void null_tenure_end_means_current() {
            assertThat(sut.isCurrentMember(null)).isTrue();
        }

        @Test
        void future_tenure_end_means_current() {
            assertThat(sut.isCurrentMember(LocalDate.now().plusDays(1))).isTrue();
        }

        @Test
        void today_tenure_end_means_current() {
            // Inclusive: tenure ending today is still current
            assertThat(sut.isCurrentMember(LocalDate.now())).isTrue();
        }

        @Test
        void past_tenure_end_means_not_current() {
            assertThat(sut.isCurrentMember(LocalDate.now().minusDays(1))).isFalse();
        }
    }
}
