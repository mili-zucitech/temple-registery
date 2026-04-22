package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Immovable asset sub-table: other land/property items per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_immov_other.
 */
@Entity
@Table(
        name = "decl_immov_other",
        indexes = {
                @Index(name = "idx_dio_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclImmovOther {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "location", length = 500)
    private String location;

    @Column(name = "area", precision = 12, scale = 4)
    private BigDecimal area;

    @Column(name = "land_type", length = 100) // Usage type
    private String landType;

    @Column(name = "document_reference", length = 200) // Revenue Department reference
    private String documentReference;

    // Additional fields from V38 migration
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "ownership_type", length = 50)
    private String ownershipType;

    @Column(name = "valuation", precision = 15, scale = 2)
    private BigDecimal valuation;
}
