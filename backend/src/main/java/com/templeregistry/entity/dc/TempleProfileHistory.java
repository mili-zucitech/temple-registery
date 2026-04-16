package com.templeregistry.entity.dc;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Append-only archive of superseded temple profiles.
 * Written once when a new profile is approved and the previous one is displaced.
 *
 * NEVER UPDATE or DELETE rows from this table.
 * Does NOT extend BaseEntity: immutable, no soft-delete, no created_by/updated_by.
 * dc_e2e Section 4.4 / V13 migration: temple_profile_history.
 */
@Entity
@Table(
        name = "temple_profile_history",
        indexes = {
                @Index(name = "idx_profile_history_temple", columnList = "temple_id, version")
        }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TempleProfileHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    @Column(name = "version", nullable = false)
    private int version;

    // Archived content fields
    @Column(name = "contact_person_name", length = 255)
    private String contactPersonName;

    @Column(name = "contact_person_designation", length = 100)
    private String contactPersonDesignation;

    @Column(name = "photo_file_path", length = 1000)
    private String photoFilePath;

    @Column(name = "bank_account_number_encrypted", columnDefinition = "TEXT")
    private String bankAccountNumberEncrypted;

    @Column(name = "languages_of_worship", length = 500)
    private String languagesOfWorship;

    @Column(name = "linked_institutions", columnDefinition = "JSON")
    private String linkedInstitutions;

    @Column(name = "annual_festivals", columnDefinition = "TEXT")
    private String annualFestivals;

    @Column(name = "landmark", length = 500)
    private String landmark;

    @Column(name = "historical_significance", columnDefinition = "TEXT")
    private String historicalSignificance;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
