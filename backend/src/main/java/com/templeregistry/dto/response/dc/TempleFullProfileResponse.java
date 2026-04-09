package com.templeregistry.dto.response.dc;

import com.templeregistry.dto.response.contractor.ContractorResponse;
import com.templeregistry.dto.response.declaration.DeclarationResponse;
import com.templeregistry.dto.response.employee.EmployeeResponse;
import com.templeregistry.dto.response.temple.TempleResponse;
import com.templeregistry.dto.response.trust.BoardMemberResponse;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Aggregated read-only view of a temple for the DC portal.
 *
 * Combines data from: temples, trust_registrations, board_members, trust_financials,
 * employees, contractors, asset_declarations, and temple_profile_current.
 * dc_e2e Section 3.2.
 */
@Getter
@Builder
public class TempleFullProfileResponse {

    // Core temple data
    private TempleResponse temple;

    // Geo labels (resolved from IDs)
    private String hobliName;
    private String talukName;
    private String districtName;
    private String cityName;

    // Trust details (null if not registered)
    private DcTrustSummary trust;

    // Board members (current)
    private List<BoardMemberResponse> boardMembers;

    // Financial summaries (most recent year first)
    private List<TrustFinancialSummary> trustFinancials;

    // Employees
    private List<EmployeeResponse> employees;

    // Contractors
    private List<ContractorResponse> contractors;

    // Declarations (most recent first)
    private List<DeclarationResponse> declarations;

    // Current approved profile (null if no approved profile yet)
    private ProfileCurrentResponse currentProfile;

    // ─── Nested summary types ─────────────────────────────────────────

    @Getter
    @Builder
    public static class DcTrustSummary {
        private Long id;
        private String trustName;
        private String trustType;
        private String registrationNumber;
        private String registeringAuthority;
        private LocalDate dateOfRegistration;
        /** Masked as AB*****1Z for DC/DC_STAFF. Full value only for SUPER_ADMIN. */
        private String panNumberMasked;
        /** Always masked as **XXXXX1234 for all roles. */
        private String bankAccountMasked;
        private String bankName;
        private String bankBranch;
        private BigDecimal annualIncome;
    }

    @Getter
    @Builder
    public static class TrustFinancialSummary {
        private String financialYear;
        private BigDecimal annualIncome;
        private BigDecimal annualExpenditure;
    }

    @Getter
    @Builder
    public static class ProfileCurrentResponse {
        private String contactPersonName;
        private String contactPersonDesignation;
        private String photoFilePath;
        private String languagesOfWorship;
        private String annualFestivals;
        private String landmark;
        private String historicalSignificance;
    }
}
