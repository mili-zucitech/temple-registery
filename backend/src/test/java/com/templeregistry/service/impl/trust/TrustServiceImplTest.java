package com.templeregistry.service.impl.trust;

import com.templeregistry.dto.request.trust.*;
import com.templeregistry.dto.response.trust.*;
import com.templeregistry.entity.temple.Temple;
import com.templeregistry.entity.trust.*;
import com.templeregistry.exception.DuplicateResourceException;
import com.templeregistry.exception.EntityNotFoundException;
import com.templeregistry.repository.document.DocumentRepository;
import com.templeregistry.repository.temple.TempleRepository;
import com.templeregistry.repository.trust.*;
import com.templeregistry.security.JurisdictionGuard;
import com.templeregistry.security.OwnershipGuard;
import com.templeregistry.security.ScopeHelper;
import com.templeregistry.service.document.DocumentService;
import com.templeregistry.service.trust.TrustValidationService;
import com.templeregistry.util.HmacUtil;
import com.templeregistry.util.PaginationUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TrustServiceImpl.
 * All DB and security dependencies are mocked.
 */
@ExtendWith(MockitoExtension.class)
class TrustServiceImplTest {

    @Mock TrustRepository trustRepository;
    @Mock BoardMemberRepository boardMemberRepository;
    @Mock BoardMeetingRepository boardMeetingRepository;
    @Mock TrustFinancialRepository financialRepository;
    @Mock TempleRepository templeRepository;
    @Mock OwnershipGuard ownershipGuard;
    @Mock JurisdictionGuard jurisdictionGuard;
    @Mock PaginationUtil paginationUtil;
    @Mock TrustValidationService trustValidationService;
    @Mock DocumentService documentService;
    @Mock DocumentRepository documentRepository;
    @Mock HmacUtil hmacUtil;

    @InjectMocks TrustServiceImpl sut;

    private Temple temple;
    private Trust trust;
    private BoardMember activeMember;

    @BeforeEach
    void setUp() {
        // Set up a TA security context
        ScopeHelper.Claims claims = new ScopeHelper.Claims(1L, "TEMPLE_AUTHORITY", null, 1L, "ta_user");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(claims, null, Collections.emptyList()));

        temple = Temple.builder()
                .districtId(1L)
                .name("Test Temple")
                .registrationNumber("REG-001")
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(temple, "id", 1L);

        trust = Trust.builder()
                .templeId(1L)
                .trustName("Sri Rama Trust")
                .trustRegistrationNumber("TR001")
                .trustPANNumber("ABCDE1234F")
                .bankAccountNumber("123456789012")
                .bankNameAndBranch("SBI||Main Branch")
                .dateOfRegistration(LocalDate.now().minusDays(30))
                .registeringAuthority("Sub-Registrar")
                .trustType(TrustType.MULTI_TRUSTEE)
                .status(TrustStatus.ACTIVE)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(trust, "id", 10L);

        activeMember = BoardMember.builder()
                .trustId(10L)
                .fullName("Govinda Rao")
                .aadhaarEncrypted("encrypted-aadhaar")
                .aadhaarHash("hash-abc")
                .aadhaarLast4("1234")
                .designation("Trustee")
                .appointmentDate(LocalDate.now().minusDays(60))
                .contactNumber("9876543210")
                .address("123 Temple St")
                .isCurrent(true)
                .build();
        org.springframework.test.util.ReflectionTestUtils.setField(activeMember, "id", 20L);

        lenient().doNothing().when(ownershipGuard).assertOwnsTemple(anyLong());
        lenient().doNothing().when(jurisdictionGuard).assertDistrictScope(any(), any());
    }

    // ─── Trust Creation ───────────────────────────────────────────────────────

    @Nested
    class TrustCreation {

        private CreateTrustRequest validRequest() {
            return CreateTrustRequest.builder()
                    .trustName("New Trust")
                    .trustType(TrustType.MULTI_TRUSTEE)
                    .registrationNumber("TR002")
                    .registeringAuthority("Authority")
                    .dateOfRegistration(LocalDate.now().minusDays(1))
                    .panNumber("ABCDE1234F")
                    .bankAccountNumber("123456789012")
                    .bankName("SBI")
                    .bankBranch("Main")
                    .build();
        }

        @Test
        void creates_trust_and_persists_temple_flag() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(trustRepository.existsByTempleIdAndIsDeletedFalse(1L)).thenReturn(false);
            when(trustRepository.save(any())).thenAnswer(inv -> {
                Trust t = inv.getArgument(0);
                org.springframework.test.util.ReflectionTestUtils.setField(t, "id", 99L);
                return t;
            });
            when(templeRepository.save(any())).thenReturn(temple);

            TrustResponse result = sut.create(1L, validRequest());

            assertThat(result).isNotNull();
            assertThat(result.getTrustName()).isEqualTo("New Trust");
            // Verify temple flag is persisted
            verify(templeRepository).save(argThat(t -> t.isTrustRegistered()));
        }

        @Test
        void response_does_not_contain_raw_pan() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(trustRepository.existsByTempleIdAndIsDeletedFalse(1L)).thenReturn(false);
            when(trustRepository.save(any())).thenAnswer(inv -> {
                Trust t = inv.getArgument(0);
                org.springframework.test.util.ReflectionTestUtils.setField(t, "id", 99L);
                return t;
            });
            when(templeRepository.save(any())).thenReturn(temple);

            TrustResponse result = sut.create(1L, validRequest());

            // TrustResponse must not expose raw PAN or bank account
            // The DTO no longer has trustPANNumber or bankAccountNumber fields
            assertThat(result.getMaskedPanNumber()).isNotNull();
            assertThat(result.getMaskedPanNumber()).doesNotContain("ABCDE1234F");
            assertThat(result.getMaskedBankAccountNumber()).isNotNull();
            assertThat(result.getMaskedBankAccountNumber()).doesNotContain("123456789012");
        }

        @Test
        void duplicate_trust_per_temple_is_rejected() {
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(trustRepository.existsByTempleIdAndIsDeletedFalse(1L)).thenReturn(true);

            assertThatThrownBy(() -> sut.create(1L, validRequest()))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("already registered");
        }

        @Test
        void throws_404_when_temple_not_found() {
            when(templeRepository.findById(99L)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> sut.create(99L, validRequest()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ─── PAN Masking ──────────────────────────────────────────────────────────

    @Nested
    class PanMasking {

        @Test
        void pan_is_masked_correctly() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));

            TrustResponse response = sut.getById(10L);

            // ABCDE1234F → AB*****4F
            assertThat(response.getMaskedPanNumber()).isEqualTo("AB*****4F");
        }

        @Test
        void bank_account_is_masked_correctly() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));

            TrustResponse response = sut.getById(10L);

            // 123456789012 → ******9012
            assertThat(response.getMaskedBankAccountNumber()).isEqualTo("******9012");
        }
    }

    // ─── Board Member Operations ──────────────────────────────────────────────

    @Nested
    class BoardMemberOperations {

        @Test
        void adds_board_member_with_hash_and_last4() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(hmacUtil.hash("123456789012")).thenReturn("test-hash");
            when(boardMemberRepository.save(any())).thenAnswer(inv -> {
                BoardMember m = inv.getArgument(0);
                org.springframework.test.util.ReflectionTestUtils.setField(m, "id", 50L);
                return m;
            });
            when(trustValidationService.isCurrentMember(any())).thenReturn(true);

            CreateBoardMemberRequest rq = new CreateBoardMemberRequest();
            rq.setFullName("New Member");
            rq.setAadhaarNumber("123456789012");
            rq.setDesignation("Trustee");
            rq.setAppointmentDate(LocalDate.now().minusDays(5));
            rq.setContactNumber("9876543210");
            rq.setAddress("Test Address");

            BoardMemberResponse result = sut.addBoardMember(10L, rq);

            assertThat(result).isNotNull();
            // Verify hash and last4 are stored
            verify(boardMemberRepository).save(argThat(m ->
                    "test-hash".equals(m.getAadhaarHash()) && "9012".equals(m.getAadhaarLast4())));
        }

        @Test
        void masked_aadhaar_uses_last4_column() {
            // last4 = "1234" → mask = "XXXX-XXXX-1234"
            assertThat(activeMember.getMaskedAadhaar()).isEqualTo("XXXX-XXXX-1234");
        }

        @Test
        void masked_aadhaar_returns_null_when_last4_not_set() {
            BoardMember member = BoardMember.builder().build();
            assertThat(member.getMaskedAadhaar()).isNull();
        }

        @Test
        void update_member_marks_as_past_with_tenure_end_date() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(boardMemberRepository.findById(20L)).thenReturn(Optional.of(activeMember));
            when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(trustValidationService.isCurrentMember(any())).thenReturn(false);

            LocalDate endDate = LocalDate.now().minusDays(1);
            UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                    .isCurrent(false)
                    .tenureEndDate(endDate)
                    .build();

            sut.updateBoardMember(10L, 20L, rq);

            assertThat(activeMember.getTenureEndDate()).isEqualTo(endDate);
            assertThat(activeMember.isCurrent()).isFalse();
        }

        @Test
        void update_member_auto_sets_tenure_end_when_marking_not_current_without_date() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(boardMemberRepository.findById(20L)).thenReturn(Optional.of(activeMember));
            when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(trustValidationService.isCurrentMember(any())).thenReturn(false);

            UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                    .isCurrent(false)
                    .tenureEndDate(null) // no date provided
                    .build();

            sut.updateBoardMember(10L, 20L, rq);

            // Should auto-set to today
            assertThat(activeMember.getTenureEndDate()).isEqualTo(LocalDate.now());
        }

        @Test
        void cross_trust_member_access_is_blocked() {
            BoardMember memberOfOtherTrust = BoardMember.builder().trustId(999L).build();
            org.springframework.test.util.ReflectionTestUtils.setField(memberOfOtherTrust, "id", 77L);
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(boardMemberRepository.findById(77L)).thenReturn(Optional.of(memberOfOtherTrust));

            UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder().fullName("Hacker").build();

            assertThatThrownBy(() -> sut.updateBoardMember(10L, 77L, rq))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        void delete_member_throws_404_when_not_found() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(boardMemberRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> sut.deleteBoardMember(10L, 99L))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ─── Financial Operations ─────────────────────────────────────────────────

    @Nested
    class FinancialOperations {

        @Test
        void submits_financial_and_saves_to_repository() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(financialRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2024-25");
            rq.setAnnualIncome(BigDecimal.valueOf(500000));

            assertThatNoException().isThrownBy(() -> sut.submitFinancial(10L, rq));
            verify(financialRepository).save(any(TrustFinancial.class));
        }

        @Test
        void lists_financials_in_descending_year_order() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            TrustFinancial f1 = TrustFinancial.builder().trustId(10L).financialYear("2024-25").build();
            TrustFinancial f2 = TrustFinancial.builder().trustId(10L).financialYear("2023-24").build();
            when(financialRepository.findAllByTrustIdOrderByFinancialYearDesc(10L))
                    .thenReturn(List.of(f1, f2));

            List<TrustFinancialResponse> result = sut.listFinancials(10L);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getFinancialYear()).isEqualTo("2024-25");
        }
    }

    // ─── Meeting Operations ───────────────────────────────────────────────────

    @Nested
    class MeetingOperations {

        @Test
        void creates_board_meeting_successfully() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            BoardMeeting saved = BoardMeeting.builder()
                    .trustId(10L)
                    .meetingDate(LocalDate.now().minusDays(1))
                    .agenda("Annual Review")
                    .build();
            org.springframework.test.util.ReflectionTestUtils.setField(saved, "id", 30L);
            when(boardMeetingRepository.save(any())).thenReturn(saved);

            CreateBoardMeetingRequest rq = CreateBoardMeetingRequest.builder()
                    .meetingDate(LocalDate.now().minusDays(1))
                    .agenda("Annual Review")
                    .build();

            BoardMeetingResponse result = sut.createBoardMeeting(10L, rq);

            assertThat(result.getAgenda()).isEqualTo("Annual Review");
            assertThat(result.getId()).isEqualTo(30L);
        }

        @Test
        void throws_404_when_trust_not_found_for_meeting() {
            when(trustRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> sut.createBoardMeeting(99L,
                    CreateBoardMeetingRequest.builder().meetingDate(LocalDate.now()).build()))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    // ─── VAL-014: Board member cessation date ────────────────────────────────

    @Nested
    class Val014CessationDate {

        @Test
        void update_with_isCurrent_true_and_no_tenure_end_is_allowed() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            when(boardMemberRepository.findById(20L)).thenReturn(Optional.of(activeMember));
            when(boardMemberRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
            when(trustValidationService.isCurrentMember(any())).thenReturn(true);

            UpdateBoardMemberRequest rq = UpdateBoardMemberRequest.builder()
                    .fullName("Updated Name")
                    .isCurrent(true)
                    .build();

            assertThatNoException().isThrownBy(() -> sut.updateBoardMember(10L, 20L, rq));
        }
    }

    // ─── VAL-013: One financial record per FY ────────────────────────────────

    @Nested
    class Val013FinancialYear {

        @Test
        void validation_service_is_called_before_save() {
            when(trustRepository.findById(10L)).thenReturn(Optional.of(trust));
            when(templeRepository.findById(1L)).thenReturn(Optional.of(temple));
            doThrow(new DuplicateResourceException("A financial record for this year already exists."))
                    .when(trustValidationService).validateFinancialRequest(anyLong(), any());

            SubmitTrustFinancialRequest rq = new SubmitTrustFinancialRequest();
            rq.setFinancialYear("2023-24");
            rq.setAnnualIncome(BigDecimal.ONE);

            assertThatThrownBy(() -> sut.submitFinancial(10L, rq))
                    .isInstanceOf(DuplicateResourceException.class);
            verify(financialRepository, never()).save(any());
        }
    }
}
