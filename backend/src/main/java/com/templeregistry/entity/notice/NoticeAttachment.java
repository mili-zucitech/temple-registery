package com.templeregistry.entity.notice;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "notice_attachments", indexes = {
        @Index(name = "idx_notice_attachments_notice", columnList = "notice_id, is_deleted")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE notice_attachments SET is_deleted = true, updated_at = NOW(6) WHERE id = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class NoticeAttachment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notice_id", nullable = false)
    private Notice notice;

    @Column(name = "original_filename", nullable = false, length = 512)
    private String originalFilename;

    @Column(name = "stored_key", nullable = false, length = 1024)
    private String storedKey;

    @Column(name = "file_size_bytes", nullable = false)
    private long fileSizeBytes;

    @Column(name = "mime_type", nullable = false, length = 128)
    private String mimeType;
}
