package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Movable asset sub-table: gold, silver, and other precious metal items per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_mov_precious_metal.
 */
@Entity
@Table(
        name = "decl_mov_precious_metal",
        indexes = {
                @Index(name = "idx_dmpm_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclMovPreciousMetal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "item_description", columnDefinition = "TEXT")
    private String itemDescription;

    @Column(name = "weight_grams", precision = 10, scale = 3)
    private BigDecimal weightGrams;

    @Column(name = "purity", length = 50)
    private String purity;

    @Column(name = "estimated_value", precision = 15, scale = 2)
    private BigDecimal estimatedValue;

    // Additional fields from V38 migration
    @Column(name = "item_type", length = 100)
    private String itemType;

    @Column(name = "acquisition_date")
    private LocalDate acquisitionDate;

    @Column(name = "storage_location", length = 255)
    private String storageLocation;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
