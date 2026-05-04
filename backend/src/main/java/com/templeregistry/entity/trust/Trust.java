package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.entity.governance.DcDecisionStatus;
import com.templeregistry.entity.governance.SubmissionStatus;
import com.templeregistry.entity.governance.SystemVerificationStatus;
import com.templeregistry.util.AesEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "trusts", indexes = {
        @Index(name = "idx_trust_temple_id", columnList = "temple_id"),
        @Index(name = "idx_trust_registration_number", columnList = "trust_registration_number")
})
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Trust extends BaseEntity {

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    @Column(name = "trust_name", nullable = false, length = 255)
    private String trustName;

    @Column(name = "trust_registration_number", nullable = false, length = 100)
    private String trustRegistrationNumber;

    @Column(name = "date_of_registration", nullable = false)
    private LocalDate dateOfRegistration;

    @Column(name = "registering_authority", nullable = false, length = 255)
    private String registeringAuthority;

    @Enumerated(EnumType.STRING)
    @Column(name = "trust_type", nullable = false, length = 20)
    private TrustType trustType;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "trust_pan_number", nullable = false, length = 255)
    private String trustPANNumber;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "bank_account_number", nullable = false, length = 255)
    private String bankAccountNumber;

    @Column(name = "bank_name_and_branch", nullable = false, length = 255)
    private String bankNameAndBranch;

    @Column(name = "annual_income")
    private java.math.BigDecimal annualIncome;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TrustStatus status;

    @Column(name = "dissolution_date")
    private LocalDate dissolutionDate;

    @Column(name = "dissolution_reason", columnDefinition = "TEXT")
    private String dissolutionReason;

    @Column(name = "dc_flag_reason", columnDefinition = "MEDIUMTEXT")
    private String dcFlagReason;

    // ─── 3-Layer Governance Status Model ─────────────────────────────────────

    /** Layer 1: Visible to all roles. Drives TA workflow. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = false, length = 20)
    private SubmissionStatus submissionStatus = SubmissionStatus.DRAFT;

    /**
     * Layer 2: INTERNAL ONLY — must NEVER be returned to Temple Authority.
     * Set by automated system checks.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "system_verification_status", length = 30)
    private SystemVerificationStatus systemVerificationStatus;

    /** Layer 3: DC decision outcome. Visible to all roles. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "dc_decision_status", nullable = false, length = 30)
    private DcDecisionStatus dcDecisionStatus = DcDecisionStatus.PENDING_DC_APPROVAL;

    /**
     * Free-text reason entered by DC on Send Back.
     * Mandatory when DC sends back. Visible to Temple Authority.
     */
    @Column(name = "send_back_reason", columnDefinition = "TEXT")
    private String sendBackReason;

    /**
     * Derived helper method to check if trust is verified by DC.
     * Returns true if dcDecisionStatus is APPROVED_BY_DC.
     * This replaces the removed isVerifiedByDc boolean field.
     */
    public boolean isVerifiedByDc() {
        return DcDecisionStatus.APPROVED_BY_DC.equals(this.dcDecisionStatus);
    }
}
