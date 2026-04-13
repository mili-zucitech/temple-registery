package com.templeregistry.entity.contractor;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "contractors", indexes = {
        @Index(name = "idx_contractors_temple_id", columnList = "temple_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE contractors SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Contractor extends BaseEntity {

    @Column(name = "temple_id", nullable = false) private Long templeId;
    @Column(name = "name", nullable = false, length = 255) private String name;
    @Column(name = "gst_number", length = 30) private String gstNumber;
    @Column(name = "service_type", length = 255) private String serviceType;
    @Column(name = "contract_reference", length = 100) private String contractReference;
    @Column(name = "work_order_date") private LocalDate workOrderDate;
    @Column(name = "contract_start_date") private LocalDate contractStartDate;
    @Column(name = "contract_end_date") private LocalDate contractEndDate;
    @Column(name = "contract_value", precision = 18, scale = 2) private BigDecimal contractValue;
    @Column(name = "payment_status", length = 50) private String paymentStatus;
    @Column(name = "document_id") private Long documentId;

    // DC Governance Fields
    @Builder.Default
    @Column(name = "is_verified_by_dc", nullable = false) private boolean isVerifiedByDc = false;
    @Column(name = "dc_flag_reason", columnDefinition = "TEXT") private String dcFlagReason;
    @Column(name = "is_gst_valid") private Boolean isGstValid;
    @Builder.Default
    @Column(name = "is_payment_pending", nullable = false) private boolean isPaymentPending = false;
}
