package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Immovable asset sub-table: leased property items per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_immov_leased.
 */
@Entity
@Table(
        name = "decl_immov_leased",
        indexes = {
                @Index(name = "idx_dil_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclImmovLeased {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "location", length = 500) // Property Address
    private String location;

    @Column(name = "lessee_name", length = 255)
    private String lesseeName;

    @Column(name = "lease_start_date")
    private LocalDate leaseStartDate;

    @Column(name = "lease_expiry")
    private LocalDate leaseExpiry;

    @Column(name = "annual_rent", precision = 15, scale = 2)
    private BigDecimal annualRent;

    @Column(name = "monthly_rent", precision = 15, scale = 2)
    private BigDecimal monthlyRent;

    @Column(name = "agreement_document_id")
    private Long agreementDocumentId;

    // Additional fields from V38 migration
    @Column(name = "property_description", columnDefinition = "TEXT")
    private String propertyDescription;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
