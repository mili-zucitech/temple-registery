package com.templeregistry.entity.temple;

import jakarta.persistence.*;
import lombok.*;

/**
 * Pre-computed denormalised read table for the temple search endpoint.
 * Rebuilt by TempleSearchSummaryService (triggered by SUPER_ADMIN or by events).
 */
@Entity
@Table(name = "temple_search_summary", indexes = {
        @Index(name = "idx_tss_district_id",  columnList = "district_id"),
        @Index(name = "idx_tss_grade",        columnList = "grade"),
        @Index(name = "idx_tss_temple_id",    columnList = "temple_id", unique = true)
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TempleSearchSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Column(name = "grade", length = 5)
    private String grade;

    @Column(name = "primary_deity", length = 150)
    private String primaryDeity;

    @Column(name = "tradition", length = 30)
    private String tradition;

    @Column(name = "hobli_id")
    private Long hobliId;

    @Column(name = "taluk_id")
    private Long talukId;

    @Column(name = "district_id", nullable = false)
    private Long districtId;

    @Column(name = "trust_registered")
    private boolean trustRegistered;

    @Column(name = "asset_declaration_status", length = 30)
    private String assetDeclarationStatus;

    @Column(name = "year_established")
    private Integer yearEstablished;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;
}
