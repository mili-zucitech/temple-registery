package com.templeregistry.entity.dc;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;

/**
 * Draft submissions from Temple Authority awaiting DC review.
 * At most one row per temple may be in PENDING_REVIEW status.
 *
 * Extends BaseEntity: has is_deleted, created_by, updated_by, audit timestamps.
 * dc_e2e Section 4.4 / V13 migration: temple_profile_staging.
 */
@Entity(name = "DcTempleProfileStaging")
@Table(
        name = "temple_profile_staging",
        indexes = {
                @Index(name = "idx_profile_staging_temple_status", columnList = "temple_id, status")
        },
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_profile_staging_temple_version", columnNames = {"temple_id", "version"})
        }
)
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE temple_profile_staging SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TempleProfileStaging extends BaseEntity {

    @Column(name = "temple_id", nullable = false)
    private Long templeId;

    @Column(name = "version", nullable = false)
    private int version = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProfileStagingStatus status = ProfileStagingStatus.DRAFT;

    // Profile content fields
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

    // Review metadata
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    private Long submittedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;
}
