package com.templeregistry.entity.document;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "documents", indexes = {
        @Index(name = "idx_doc_owner_type", columnList = "owner_type, owner_id"),
        @Index(name = "idx_doc_reference_id", columnList = "reference_id")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE documents SET is_deleted = true, updated_at = NOW() WHERE id = ?")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class Document extends BaseEntity {

    /** Logical owner type: TEMPLE, TRUST, EMPLOYEE, CONTRACTOR, DECLARATION */
    @Column(name = "owner_type", nullable = false, length = 32)
    private String ownerType;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /** Reference to the related entity (templeId, trustId, etc.) */
    @Column(name = "reference_id")
    private Long referenceId;

    /** Original filename provided by uploader */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /** S3 object key — never expose directly to clients */
    @Column(name = "s3_key", nullable = false, length = 512)
    private String s3Key;

    @Column(name = "mime_type", nullable = false, length = 128)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    /** Human-readable label, e.g. "Trust Deed", "Aadhaar Card" */
    @Column(name = "document_label", length = 128)
    private String documentLabel;
}
