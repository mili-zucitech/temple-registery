package com.templeregistry.entity.document;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Append-only audit log: every access (view/download) of a document is recorded.
 * Does <b>not</b> extend BaseEntity — no soft-delete, no updatedAt.
 */
@Entity
@Table(name = "document_access_logs", indexes = {
        @Index(name = "idx_da_doc_id", columnList = "document_id"),
        @Index(name = "idx_da_accessor_id", columnList = "accessor_id")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    /** User who accessed the document */
    @Column(name = "accessor_id", nullable = false)
    private Long accessorId;

    @Column(name = "accessor_role", nullable = false, length = 32)
    private String accessorRole;

    /** VIEW or DOWNLOAD */
    @Column(name = "access_type", nullable = false, length = 16)
    private String accessType;

    @CreationTimestamp
    @Column(name = "accessed_at", nullable = false, updatable = false)
    private LocalDateTime accessedAt;
}
