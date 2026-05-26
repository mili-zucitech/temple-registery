package com.templeregistry.entity.notice;

import com.templeregistry.entity.base.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "notices", indexes = {
        @Index(name = "idx_notices_district_status", columnList = "district_id, status, is_deleted"),
        @Index(name = "idx_notices_scope_status",    columnList = "scope, status, is_deleted"),
        @Index(name = "idx_notices_created_by",      columnList = "created_by"),
        @Index(name = "idx_notices_expiry",          columnList = "expiry_date, status"),
        @Index(name = "idx_notices_pinned_status",   columnList = "is_pinned, status, is_deleted")
})
@SQLRestriction("is_deleted = false")
@SQLDelete(sql = "UPDATE notices SET is_deleted = true, updated_at = NOW(6) WHERE id = ? AND version = ?")
@Getter @Setter @SuperBuilder @NoArgsConstructor @AllArgsConstructor
public class Notice extends BaseEntity {

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(name = "scope", nullable = false, length = 20)
    private NoticeScope scope;

    @Column(name = "district_id")
    private Long districtId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private NoticeStatus status = NoticeStatus.PUBLISHED;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 10)
    @Builder.Default
    private NoticePriority priority = NoticePriority.MEDIUM;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private boolean pinned = false;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "notice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<NoticeAttachment> attachments = new ArrayList<>();
}
