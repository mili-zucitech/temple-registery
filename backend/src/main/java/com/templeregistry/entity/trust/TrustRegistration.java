package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "trust_registrations", indexes = {
        @Index(name = "idx_trust_temple_id", columnList = "temple_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE trust_registrations SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TrustRegistration extends BaseEntity {

    @Version
    @Column(name = "version") private Long version;

    @Column(name = "temple_id", nullable = false) private Long templeId;

    @Column(name = "trust_name", nullable = false, length = 255) private String trustName;

    @Enumerated(EnumType.STRING)
    @Column(name = "trust_type", nullable = false, length = 20) private TrustType trustType;

    @Column(name = "registration_number", nullable = false, length = 100) private String registrationNumber;

    @Column(name = "registering_authority", length = 255) private String registeringAuthority;

    @Column(name = "date_of_registration", nullable = false) private LocalDate dateOfRegistration;

    @Column(name = "pan_number_encrypted") private String panNumberEncrypted;

    @Column(name = "bank_account_number_encrypted") private String bankAccountNumberEncrypted;

    @Column(name = "bank_name", length = 255) private String bankName;

    @Column(name = "bank_branch", length = 255) private String bankBranch;

    @Column(name = "annual_income", precision = 18, scale = 2) private BigDecimal annualIncome;
}
