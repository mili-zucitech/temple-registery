package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Immovable asset sub-table: agricultural land items per declaration.
 * One declaration may have many land parcels.
 * dc_e2e Section 4.8a / V14 migration: decl_immov_agri_land.
 */
@Entity
@Table(
        name = "decl_immov_agri_land",
        indexes = {
                @Index(name = "idx_diag_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclImmovAgriLand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "survey_number", length = 100)
    private String surveyNumber;

    @Column(name = "location", length = 500) // Village
    private String location;

    @Column(name = "area_acres", precision = 10, scale = 4)
    private BigDecimal areaAcres;

    @Column(name = "encumbrance", columnDefinition = "TEXT") // Owner of Record
    private String encumbrance;

    // Additional fields from V38 migration
    @Column(name = "market_value", precision = 18, scale = 2)
    private BigDecimal marketValue;

    @Column(name = "ownership_type", length = 50) // Patta Status
    private String ownershipType;

    @Column(name = "document_reference", length = 200)
    private String documentReference;

    @Column(name = "annual_lease_income", precision = 15, scale = 2)
    private BigDecimal annualLeaseIncome;
}
