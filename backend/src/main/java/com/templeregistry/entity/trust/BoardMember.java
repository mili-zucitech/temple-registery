package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "board_members", indexes = {
        @Index(name = "idx_board_members_trust_id", columnList = "trust_id")
})
@SQLRestriction("is_deleted = false")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class BoardMember extends BaseEntity {

    @Column(name = "trust_id", nullable = false)
    private Long trustId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "aadhaar_encrypted")
    private String aadhaarEncrypted;

    @Column(name = "designation", nullable = false, length = 150)
    private String designation;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "tenure_end_date")
    private LocalDate tenureEndDate;

    @Column(name = "contact_number", length = 15)
    private String contactNumber;

    @Column(name = "address")
    private String address;

    // Masked Aadhaar accessor for API response
    public String getMaskedAadhaar() {
        if (aadhaarEncrypted == null || aadhaarEncrypted.length() < 4) return null;
        return "XXXX-XXXX-" + aadhaarEncrypted.substring(aadhaarEncrypted.length() - 4);
    }

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private boolean isCurrent = true;

    @Column(name = "is_verified_by_dc", nullable = false)
    @Builder.Default
    private boolean isVerifiedByDc = false;

    @Column(name = "dc_flag_reason", columnDefinition = "MEDIUMTEXT")
    private String dcFlagReason;
}
