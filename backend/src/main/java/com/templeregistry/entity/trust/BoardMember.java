package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import com.templeregistry.util.AesEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "board_members", indexes = {
        @Index(name = "idx_board_members_trust_id", columnList = "trust_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE board_members SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class BoardMember extends BaseEntity {

    @Column(name = "trust_id", nullable = false) private Long trustId;

    @Column(name = "full_name", nullable = false, length = 200) private String fullName;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "aadhaar_encrypted", columnDefinition = "TEXT") private String aadhaarEncrypted;

    @Column(name = "designation", length = 150) private String designation;

    @Column(name = "appointment_date") private LocalDate appointmentDate;

    @Column(name = "tenure_end_date") private LocalDate tenureEndDate;

    @Column(name = "contact_number", length = 15) private String contactNumber;

    @Column(name = "address", columnDefinition = "TEXT") private String address;

    @Builder.Default
    @Column(name = "is_current", nullable = false) private boolean isCurrent = true;

    // DC Governance Fields
    @Builder.Default
    @Column(name = "is_verified_by_dc", nullable = false) private boolean isVerifiedByDc = false;
    @Column(name = "dc_flag_reason", columnDefinition = "TEXT") private String dcFlagReason;

    public String getMaskedAadhaar() {
        if (aadhaarEncrypted == null || aadhaarEncrypted.length() < 4) return "****";
        // This is a simplified version, in reality we'd decrypt and mask.
        // For now, let's assume we return a placeholder.
        return "********" + (aadhaarEncrypted.length() > 4 ? 
            aadhaarEncrypted.substring(aadhaarEncrypted.length() - 4) : "****");
    }
}
