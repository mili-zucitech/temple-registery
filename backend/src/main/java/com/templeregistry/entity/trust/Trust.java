package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
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

    @Version
    @Column(name = "lock_version", nullable = false)
    private Long lockVersion;

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

    /**
     * Internal system verification status. NEVER exposed to Temple Authority.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "system_verification_status", length = 30)
    private SystemVerificationStatus systemVerificationStatus;

    /**
     * Free-text reason entered by DC on Send Back.
     * Mandatory when DC sends back. Visible to Temple Authority.
     * This field is kept as display data — it is NOT a governance status field.
     */
    @Column(name = "send_back_reason", columnDefinition = "TEXT")
    private String sendBackReason;
}
