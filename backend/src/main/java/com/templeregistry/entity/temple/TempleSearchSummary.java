package com.templeregistry.entity.temple;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Pre-computed denormalised read table for the temple search endpoint.
 * Rebuilt by TempleSearchSummaryService (triggered after workflow actions).
 * dc_e2e Section 4.11.
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

    /** Denormalized district id from geo hierarchy — for fast WHERE filtering. */
    @Column(name = "district_id", nullable = false)
    private Long districtId;

    /** Denormalized city id from district's city — populated by refresh(). */
    @Column(name = "city_id")
    private Long cityId;

    /** Temple lifecycle status (ACTIVE | INACTIVE | SUSPENDED). */
    @Column(name = "temple_status", length = 20)
    private String templeStatus;

    @Column(name = "trust_registered")
    private Boolean trustRegistered;

    /** DC-facing declaration lifecycle status (mirrors temple.assetDeclarationStatus). */
    @Column(name = "asset_declaration_status", length = 30)
    private String assetDeclarationStatus;

    @Column(name = "year_established")
    private Integer yearEstablished;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ---- DC module dashboard / search counters ----

    /** Count of in-flight declarations requiring workflow attention in the DC module. */
    @Column(name = "pending_declarations")
    private Integer pendingDeclarations;

    @Column(name = "overdue_declarations")
    private Integer overdueDeclarations;

    @Column(name = "pending_profile_review")
    private Integer pendingProfileReview;

    @Column(name = "has_active_trust")
    private Boolean hasActiveTrust;

    @Column(name = "has_approved_declaration")
    private Boolean hasApprovedDeclaration;

    @Column(name = "last_declaration_at")
    private LocalDateTime lastDeclarationAt;

    @Column(name = "last_profile_update_at")
    private LocalDateTime lastProfileUpdateAt;
}

