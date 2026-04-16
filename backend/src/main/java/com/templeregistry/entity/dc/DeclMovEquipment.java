package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Movable asset sub-table: electronic and office equipment per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_mov_equipment.
 */
@Entity
@Table(
        name = "decl_mov_equipment",
        indexes = {
                @Index(name = "idx_dme_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclMovEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "unit_value", precision = 15, scale = 2)
    private BigDecimal unitValue;

    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;
}
