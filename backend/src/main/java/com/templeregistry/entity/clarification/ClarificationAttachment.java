package com.templeregistry.entity.clarification;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * File attachment on a clarification message.
 * Typically uploaded by TA when responding to DC requests for supporting evidence.
 */
@Entity
@Table(
    name = "clarification_attachments",
    indexes = {
        @Index(name = "idx_ca_message_id", columnList = "message_id")
    }
)
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class ClarificationAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false, updatable = false)
    private ClarificationMessage message;

    @Column(name = "file_path", length = 500, nullable = false, updatable = false)
    private String filePath;

    @Column(name = "file_name", length = 255, nullable = false, updatable = false)
    private String fileName;

    @Column(name = "file_size_bytes", updatable = false)
    private Long fileSizeBytes;

    @Column(name = "content_type", length = 100, updatable = false)
    private String contentType;
}
