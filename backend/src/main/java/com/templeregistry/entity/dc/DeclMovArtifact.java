package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Movable asset sub-table: idols and sacred artifacts per declaration.
 * dc_e2e Section 4.8a / V14 migration: decl_mov_artifact.
 */
@Entity
@Table(
        name = "decl_mov_artifact",
        indexes = {
                @Index(name = "idx_dma_decl", columnList = "declaration_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class DeclMovArtifact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "declaration_id", nullable = false)
    private Long declarationId;

    // User-specified fields
    @Column(name = "artifact_type", length = 100) // Material
    private String artifactType;

    @Column(name = "material", length = 100)
    private String material;

    @Column(name = "age_years")
    private Integer ageYears; // Age/Period

    @Column(name = "age_or_period", length = 100)
    private String ageOrPeriod;

    @Column(name = "historical_significance", columnDefinition = "TEXT") // Known Provenance
    private String historicalSignificance;

    @Column(name = "provenance", columnDefinition = "TEXT")
    private String provenance;

    @Column(name = "condition_text", length = 100) // Museum-grade classification
    private String conditionText;

    @Column(name = "museum_grade_classification", length = 100)
    private String museumGradeClassification;

    // Additional fields from V38 migration
    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "estimated_value", precision = 15, scale = 2)
    private BigDecimal estimatedValue;

    @Column(name = "storage_location", length = 255)
    private String storageLocation;

    @Column(name = "document_reference", length = 200)
    private String documentReference;
}
