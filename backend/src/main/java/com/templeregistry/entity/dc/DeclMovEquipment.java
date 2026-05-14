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

    // User-specified fields - Item list with serial numbers and approximate value
    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "total_value", precision = 15, scale = 2)
    private BigDecimal totalValue;

    // Additional fields from V38 migration
    @Column(name = "equipment_type", length = 100)
    private String equipmentType;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "year_of_purchase")
    private Integer yearOfPurchase;

    @Column(name = "condition_text", length = 100)
    private String conditionText;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "unit_value", precision = 15, scale = 2)
    private BigDecimal unitValue;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
