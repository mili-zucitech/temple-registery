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

    @Column(name = "lessee_name", length = 255)
    private String lesseeName;

    @Column(name = "lease_expiry")
    private LocalDate leaseExpiry;

    @Column(name = "annual_rent", precision = 15, scale = 2)
    private BigDecimal annualRent;
}
