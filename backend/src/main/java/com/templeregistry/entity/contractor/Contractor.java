package com.templeregistry.entity.contractor;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contractors", indexes = {
        @Index(name = "idx_contractors_temple_id", columnList = "temple_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE contractors SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Contractor extends BaseEntity {

    @Column(name = "temple_id", nullable = false) private Long templeId;
    @Column(name = "company_name", nullable = false, length = 255) private String companyName;
    @Column(name = "gst_number", length = 30) private String gstNumber;
    
    @Convert(converter = ServiceTypeConverter.class)
    @Column(name = "service_type", length = 128) private ServiceType serviceType;
    
    @Column(name = "contract_reference", length = 100) private String contractReference;
    @Column(name = "work_order_date") private LocalDate workOrderDate;
    @Column(name = "contract_start_date") private LocalDate contractStartDate;
    @Column(name = "contract_end_date") private LocalDate contractEndDate;
    @Column(name = "contract_value", precision = 18, scale = 2) private BigDecimal contractValue;
    
    @Convert(converter = PaymentStatusConverter.class)
    @Column(name = "payment_status", length = 50) private PaymentStatus paymentStatus;
    
    // Multiple document IDs stored as comma-separated values
    // Better approach would be a separate table, but for simplicity using CSV
    @Column(name = "document_ids", columnDefinition = "TEXT") private String documentIds;

    // DC Governance Fields
    @Builder.Default
    @Column(name = "is_verified_by_dc", nullable = false) private boolean verifiedByDc = false;
    @Column(name = "dc_flag_reason", columnDefinition = "TEXT") private String dcFlagReason;
    @Column(name = "is_gst_valid") private Boolean gstValid;
    @Builder.Default
    @Column(name = "is_payment_pending", nullable = false) private boolean paymentPending = false;
    
    // Helper methods for document IDs
    public List<Long> getDocumentIdList() {
        if (documentIds == null || documentIds.trim().isEmpty()) {
            return new ArrayList<>();
        }
        List<Long> ids = new ArrayList<>();
        for (String id : documentIds.split(",")) {
            try {
                ids.add(Long.parseLong(id.trim()));
            } catch (NumberFormatException e) {
                // Skip invalid IDs
            }
        }
        return ids;
    }
    
    public void setDocumentIdList(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            this.documentIds = null;
        } else {
            this.documentIds = String.join(",", ids.stream().map(String::valueOf).toList());
        }
    }
    
    public void addDocumentId(Long documentId) {
        List<Long> ids = getDocumentIdList();
        if (!ids.contains(documentId)) {
            ids.add(documentId);
            setDocumentIdList(ids);
        }
    }
    
    public void removeDocumentId(Long documentId) {
        List<Long> ids = getDocumentIdList();
        ids.remove(documentId);
        setDocumentIdList(ids);
    }
}
