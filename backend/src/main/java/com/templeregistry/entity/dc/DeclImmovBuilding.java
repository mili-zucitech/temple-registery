package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Immovable asset sub-table: building/structure items per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_immov_building.
 */
@Entity
@Table(
        name = "decl_immov_building",
        indexes = {
                @Index(name = "idx_dib_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclImmovBuilding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "area_sqft", precision = 12, scale = 2)
    private BigDecimal areaSqft;

    @Column(name = "year_of_construction")
    private Integer yearOfConstruction;

    @Column(name = "structure_type", length = 100)
    private String structureType;

    @Column(name = "valuation", precision = 15, scale = 2)
    private BigDecimal valuation;

    // Additional fields from V38 migration
    @Column(name = "building_name", length = 255)
    private String buildingName;

    @Column(name = "usage_purpose", length = 200)
    private String usagePurpose;

    @Column(name = "condition_text", length = 100)
    private String conditionText;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
