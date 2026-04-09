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

    @Column(name = "survey_number", length = 100)
    private String surveyNumber;

    @Column(name = "area_acres", precision = 10, scale = 4)
    private BigDecimal areaAcres;

    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "encumbrance", columnDefinition = "TEXT")
    private String encumbrance;

    @Column(name = "annual_lease_income", precision = 15, scale = 2)
    private BigDecimal annualLeaseIncome;
}
