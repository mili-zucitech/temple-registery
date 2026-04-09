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

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "area", precision = 12, scale = 4)
    private BigDecimal area;

    @Column(name = "valuation", precision = 15, scale = 2)
    private BigDecimal valuation;
}
