package com.templeregistry.entity.trust;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "trust_financials", indexes = {
        @Index(name = "idx_trust_fin_trust_id", columnList = "trust_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE trust_financials SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TrustFinancial extends BaseEntity {

    @Column(name = "trust_id", nullable = false) private Long trustId;
    @Column(name = "financial_year", nullable = false, length = 10) private String financialYear;
    @Column(name = "annual_income", precision = 18, scale = 2) private BigDecimal annualIncome;
    @Column(name = "annual_expenditure", precision = 18, scale = 2) private BigDecimal annualExpenditure;
    @Column(name = "submitted_at") private java.time.LocalDateTime submittedAt;
    @Column(name = "document_id") private Long documentId;
}
