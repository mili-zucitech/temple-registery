package com.templeregistry.entity.dc;

import com.templeregistry.util.AesEncryptionConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Holds the single currently-approved profile for each temple.
 * The UNIQUE constraint on temple_id enforces the at-most-one invariant.
 *
 * Does NOT extend BaseEntity: no is_deleted, no created_by/updated_by.
 * Mutated (UPSERT pattern) when DC approves a profile staging submission.
 * dc_e2e Section 4.4 / V13 migration: temple_profile_current.
 */
@Entity
@Table(
        name = "temple_profile_current",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_profile_current_temple", columnNames = "temple_id")
        }
)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TempleProfileCurrent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    // Mirrored approved content fields
    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "website", length = 500)
    private String website;

    @Column(name = "contact_person_name", length = 255)
    private String contactPersonName;

    @Column(name = "contact_person_designation", length = 100)
    private String contactPersonDesignation;

    @Column(name = "photo_file_path", length = 1000)
    private String photoFilePath;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Convert(converter = AesEncryptionConverter.class)
    @Column(name = "bank_account_number_encrypted", columnDefinition = "TEXT")
    private String bankAccountNumberEncrypted;

    @Column(name = "bank_ifsc", length = 11)
    private String bankIfsc;

    @Column(name = "languages_of_worship", length = 500)
    private String languagesOfWorship;

    @Column(name = "linked_institutions", columnDefinition = "JSON")
    private String linkedInstitutions;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "annual_festivals", columnDefinition = "TEXT")
    private String annualFestivals;

    @Column(name = "landmark", length = 500)
    private String landmark;

    @Column(name = "historical_significance", columnDefinition = "TEXT")
    private String historicalSignificance;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    @Column(name = "published_by", nullable = false)
    private Long publishedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
